package common

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"

	"github.com/go-redis/redis/v8"
	"github.com/shopspring/decimal"
)

type KPIReport struct {
	KPIName        string          `json:"kpiName"`
	PeriodId       PeriodKey       `json:"periodId"`
	DimensionValue DimensionValue  `json:"dimensionValue"`
	GraphQLURL     string          `json:"graphqlUrl"`
	InitialValue   decimal.Decimal `json:"firstRoundedKPI"`
	LatestValue    decimal.Decimal `json:"lastRoundedKPI"`
	Events         []EventObject   `json:"events"`
}

type SyncConfig struct {
	GithubToken        string
	GithubRepoOwner    string
	GithubRepoName     string
	GithubRepoFilePath string
	DateColumn         string
	StartDate          string
	KpiColumn          string
	NotionAPIKey       string
	NotionDatabaseID   string
}

type EventObject struct {
	CommitTimestamp int64            `json:"commitTimestamp"`
	CommitUrl       string           `json:"commitUrl"`
	Diff            float64          `json:"diff"`
	EventType       EventType        `json:"eventType"`
	CommitComments  []CommitComments `json:"commitComments"`
}

type EventType string

type CommitComments struct {
	CommentAuthor string
	CommentBody   string
}

const (
	EventTypeCreate EventType = "create"
	EventTypeUpdate EventType = "update"
)

type CommitData struct {
	Lines           int
	KPI             decimal.Decimal
	CommitTimestamp int64
	CommitUrl       string
	CommitComments  []CommitComments
}

func (c CommitData) Timestamp() int64 {
	return c.CommitTimestamp
}

type CommitSha string
type PeriodKey string
type PeriodAndDimensionKey string
type Dimension string
type DimensionValue string
type MetricHistory map[CommitSha]CommitData
type Metric struct {
	TimeGrain      TimeGrain
	Period         PeriodKey
	Dimension      Dimension
	DimensionValue DimensionValue
	History        MetricHistory
}
type Metrics map[PeriodAndDimensionKey]Metric

type Config struct {
	NotionAPIToken   string         `json:"notionAPIToken"`
	NotionDatabaseID string         `json:"notionDatabaseId"`
	Metrics          []MetricConfig `json:"metrics"`
}

type TimeGrain string

const (
	Day     TimeGrain = "day"
	Week    TimeGrain = "week"
	Month   TimeGrain = "month"
	Quarter TimeGrain = "quarter"
	Year    TimeGrain = "year"
)

type MetricConfig struct {
	Filepath       string      `json:"filepath"`
	DateColumnName string      `json:"dateColumnName"`
	KPIColumnName  string      `json:"KPIColumnName"`
	MetricName     string      `json:"metricName"`
	TimeGrains     []TimeGrain `json:"timeGrains"`
	Dimensions     []string    `json:"dimensions"`
}

type MetricRedisKey string

var ctx = context.Background()

func GetKeysFromJSON(path MetricRedisKey) (Metrics, error) {
	var redisURL = os.Getenv("REDIS_URL")
	redisOpt, redisErr := redis.ParseURL(redisURL)

	if redisErr != nil {
		jsonFile, err := os.ReadFile(string(path))
		if err != nil {
			return nil, err
		}

		var data Metrics
		err = json.Unmarshal(jsonFile, &data)
		if err != nil {
			return nil, err
		}

		return data, nil
	} else {
		var rdb = redis.NewClient(redisOpt)

		jsonData, err := rdb.Get(ctx, string(path)).Bytes()
		if err != nil {
			log.Fatalf("Could not get key. Err: %s", err)
			return nil, err
		}

		var data Metrics
		err = json.Unmarshal(jsonData, &data)
		if err != nil {
			return nil, err
		}
		rdb.Close()
		return data, nil
	}
}

func StoreMetricMetadataAndAggregatedData(installationId int, metricName string, lineCountAndKPIByDateByVersion Metrics) MetricRedisKey {
	metricStoredFilePath := GetMetricFilepath(fmt.Sprint(installationId), metricName)
	var redisURL = os.Getenv("REDIS_URL")
	redisOpt, redisErr := redis.ParseURL(redisURL)

	if redisErr != nil {

		file, err := os.Create(string(metricStoredFilePath))
		if err != nil {
			log.Fatalf("Error creating file: %v", err.Error())
		}
		defer file.Close()

		enc := json.NewEncoder(file)
		if err := enc.Encode(lineCountAndKPIByDateByVersion); err != nil {
			log.Fatalf("Error writing JSON to file: %v", err.Error())
		}
		fmt.Println("Results written to file")
	} else {
		var rdb = redis.NewClient(redisOpt)
		fmt.Println("Storing results in Redis")

		jsonData, err := json.Marshal(lineCountAndKPIByDateByVersion)
		if err != nil {
			log.Fatalf("Error occurred during marshaling. Err: %s", err)
		}
		err = rdb.Set(ctx, string(metricStoredFilePath), jsonData, 0).Err()
		if err != nil {
			log.Fatalf("Could not set key. Err: %s", err)
		}
		rdb.Close()
	}
	return metricStoredFilePath
}

func GetMetricFilepath(installationId string, metricName string) MetricRedisKey {
	metricNameEncoded := url.PathEscape(metricName)
	filepath := fmt.Sprintf("dist/%s_%s_lineCountAndKPIByDateByVersion.json", installationId, metricNameEncoded)
	return MetricRedisKey(filepath)
}

package common

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"

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

func GetKeysFromJSON(path string) (Metrics, error) {
	// Read the file at the given path
	jsonFile, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	// Unmarshal the JSON data into the desired type
	var data Metrics
	err = json.Unmarshal(jsonFile, &data)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func GetMetricFilepath(installationId string, metricName string, timestamp string) string {
	metricNameEncoded := url.PathEscape(metricName)
	filepath := fmt.Sprintf("dist/%s_%s_lineCountAndKPIByDateByVersion_%s.json", installationId, metricNameEncoded, timestamp)
	return filepath
}

func GetLatestMetricFile(installationId string, metricName string) (string, error) {
	filepathPattern := fmt.Sprintf("dist/%s_%s_lineCountAndKPIByDateByVersion_*.json", installationId, metricName)
	files, err := filepath.Glob(filepathPattern)
	if err != nil {
		return "", err
	}

	if len(files) == 0 {
		return "", fmt.Errorf("no files found matching pattern %q", filepathPattern)
	}

	// Check the most recent file

	return files[0], nil
}

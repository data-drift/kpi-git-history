package reports

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/data-drift/kpi-git-history/common"
	"github.com/data-drift/kpi-git-history/database/notion_database"
	"github.com/dstotijn/go-notion"
	"github.com/shopspring/decimal"
)

func CreateReport(syncConfig common.SyncConfig, KPIInfo common.KPIReport) error {
	timeGrain, _ := GetTimeGrain(KPIInfo.PeriodId)
	reportNotionPageId, _ := notion_database.FindOrCreateReportPageId(syncConfig.NotionAPIKey, syncConfig.NotionDatabaseID, KPIInfo.KPIName, KPIInfo.PeriodId, timeGrain)
	fmt.Println(reportNotionPageId)

	params := notion.CreatePageParams{
		Children: []notion.Block{
			notion.Heading1Block{
				RichText: []notion.RichText{
					{
						Text: &notion.Text{
							Content: "Overview",
						},
					},
				},
			},
			notion.ParagraphBlock{
				RichText: []notion.RichText{
					{
						Text: &notion.Text{
							Content: KPIInfo.KPIName,
						},
						Annotations: &notion.Annotations{
							Code: true,
						},
					},
					{
						Text: &notion.Text{
							Content: " initial value was: ",
						},
					},
					{
						Text: &notion.Text{
							Content: KPIInfo.InitialValue.String(),
						},
						Annotations: &notion.Annotations{
							Bold: true,
						},
					},
				},
			},
			notion.ParagraphBlock{
				RichText: []notion.RichText{
					{
						Text: &notion.Text{
							Content: KPIInfo.KPIName,
						},
						Annotations: &notion.Annotations{
							Code: true,
						},
					},
					{
						Text: &notion.Text{
							Content: " current value is: ",
						},
					},
					{
						Text: &notion.Text{
							Content: KPIInfo.LatestValue.String(),
						},
						Annotations: &notion.Annotations{
							Bold: true,
						},
					},
				},
			},
			notion.ParagraphBlock{
				RichText: []notion.RichText{
					{
						Text: &notion.Text{
							Content: "Total drift since initial value: ",
						},
					},
					{
						Text: &notion.Text{
							Content: displayDiff(KPIInfo.LatestValue.Sub(KPIInfo.InitialValue)),
						},
						Annotations: &notion.Annotations{
							Bold:  true,
							Color: displayDiffColor(KPIInfo.LatestValue.Sub(KPIInfo.InitialValue)),
						},
					},
				},
			},
			notion.Heading1Block{
				RichText: []notion.RichText{
					{
						Text: &notion.Text{
							Content: "Timeline",
						},
					},
				},
			},
			notion.EmbedBlock{
				URL: KPIInfo.GraphQLURL,
			},
			notion.Heading1Block{
				RichText: []notion.RichText{
					{
						Text: &notion.Text{
							Content: "Changelog",
						},
					},
				},
			},
		},
	}
	var children []notion.Block
	for _, event := range KPIInfo.Events {
		driftEventDate := notion.ParagraphBlock{
			RichText: []notion.RichText{
				{
					Text: &notion.Text{
						Content: "🗓 Event ",
					},
				},

				{
					Mention: &notion.Mention{
						Type: notion.MentionTypeDate,
						Date: &notion.Date{
							Start: notion.NewDateTime(time.Unix(event.CommitTimestamp, 0), true),
						},
					},
				},
			},
		}
		bulletListFirstItemCreateEvent := notion.BulletedListItemBlock{
			RichText: []notion.RichText{
				{
					Text: &notion.Text{
						Content: "Initial value: ",
					},
				},
				{
					Text: &notion.Text{
						Content: KPIInfo.InitialValue.String(),
					},
					Annotations: &notion.Annotations{
						Bold:  true,
						Color: notion.ColorGray,
					},
				},
			},
		}
		bulletListFirstItemUpdateEvent := notion.BulletedListItemBlock{
			RichText: []notion.RichText{
				{
					Text: &notion.Text{
						Content: "Impact: ",
					},
				},
				{
					Text: &notion.Text{
						Content: displayDiff(decimal.NewFromFloat(event.Diff)),
					},
					Annotations: &notion.Annotations{
						Bold:  true,
						Color: displayDiffColor(decimal.NewFromFloat(event.Diff)),
					},
				},
			},
		}
		bulletListSecondItemUpdateEvent := notion.BulletedListItemBlock{
			RichText: []notion.RichText{
				{
					Text: &notion.Text{
						Content: "commit",
						Link:    &notion.Link{URL: event.CommitUrl},
					},
				},
			},
		}
		if event.EventType == "create" {
			children = append(children, driftEventDate, bulletListFirstItemCreateEvent)
		} else {
			children = append(children, driftEventDate, bulletListFirstItemUpdateEvent, bulletListSecondItemUpdateEvent)
		}
	}
	params.Children = append(params.Children, children...)

	err := notion_database.UpdateReport(syncConfig.NotionAPIKey, reportNotionPageId, params.Children)
	if err != nil {
		return fmt.Errorf("failed to create page: %v", err)
	}

	return nil
}

func displayDiff(diff decimal.Decimal) string {
	if diff.IsPositive() {

		return "+" + diff.String()
	}
	return diff.String()
}

func displayDiffColor(diff decimal.Decimal) notion.Color {

	if diff.IsNegative() {
		return notion.ColorOrange
	}
	return notion.ColorBlue
}

func GetTimeGrain(periodKey string) (common.TimeGrain, error) {
	_, err := time.Parse("2006-01-02", periodKey)
	if err == nil {
		return common.Day, nil
	}
	_, err = time.Parse("2006-W01", periodKey)
	if err == nil {
		return common.Week, nil
	}
	_, err = time.Parse("2006-01", periodKey)
	if err == nil {
		return common.Month, nil
	}
	_, err = ParseQuarterDate(periodKey)
	if err == nil {
		return common.Quarter, nil
	}
	_, err = time.Parse("2006", periodKey)
	if err == nil {
		return common.Year, nil
	}
	return "", fmt.Errorf("invalid period key: %s", periodKey)
}

func ParseQuarterDate(s string) (time.Time, error) {
	parts := strings.Split(s, "-")
	if len(parts) != 2 {
		return time.Time{}, fmt.Errorf("invalid quarter date format: %s", s)
	}
	year, err := strconv.Atoi(parts[0])
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid year format in quarter date: %s", s)
	}
	quarter := parts[1]
	switch quarter {
	case "Q1":
		return time.Date(year, time.March, 31, 0, 0, 0, 0, time.UTC), nil
	case "Q2":
		return time.Date(year, time.June, 30, 0, 0, 0, 0, time.UTC), nil
	case "Q3":
		return time.Date(year, time.September, 30, 0, 0, 0, 0, time.UTC), nil
	case "Q4":
		return time.Date(year, time.December, 31, 0, 0, 0, 0, time.UTC), nil
	default:
		return time.Time{}, fmt.Errorf("invalid quarter format in quarter date: %s", s)
	}
}

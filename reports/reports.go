package reports

import (
	"fmt"
	"strconv"
	"time"

	"github.com/data-drift/kpi-git-history/common"
	notion_database "github.com/data-drift/kpi-git-history/database/notion"
	"github.com/dstotijn/go-notion"
)

func CreateReport(syncConfig common.SyncConfig, KPIInfo common.KPIInfo) error {
	reportNotionPageId, _ := notion_database.FindOrCreateReportPageId(syncConfig.NotionAPIKey, syncConfig.NotionDatabaseID, KPIInfo.KPIName)
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
							Content: strconv.Itoa(KPIInfo.FirstRoundedKPI),
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
							Content: strconv.Itoa(KPIInfo.LastRoundedKPI),
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
							Content: displayDiff(KPIInfo.LastRoundedKPI - KPIInfo.FirstRoundedKPI),
						},
						Annotations: &notion.Annotations{
							Bold:  true,
							Color: displayDiffColor(KPIInfo.LastRoundedKPI - KPIInfo.FirstRoundedKPI),
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
		paragraph := notion.ParagraphBlock{
			RichText: []notion.RichText{
				{
					Text: &notion.Text{
						Content: "🗓 Date " + time.Unix(event.CommitTimestamp, 0).Format("2006-01-02"),
					},
					Annotations: &notion.Annotations{
						Underline: true,
					},
				},
			},
		}
		bulletListFirstItem := notion.BulletedListItemBlock{
			RichText: []notion.RichText{
				{
					Text: &notion.Text{
						Content: "Impact: ",
					},
				},
				{
					Text: &notion.Text{
						Content: displayDiff(event.Diff),
					},
					Annotations: &notion.Annotations{
						Bold:  true,
						Color: displayDiffColor(event.Diff),
					},
				},
			},
		}
		bulletListSecondItem := notion.BulletedListItemBlock{
			RichText: []notion.RichText{
				{
					Text: &notion.Text{
						Content: "commit",
						Link:    &notion.Link{URL: event.CommitUrl},
					},
				},
			},
		}
		children = append(children, paragraph, bulletListFirstItem, bulletListSecondItem)
	}
	params.Children = append(params.Children, children...)

	err := notion_database.UpdateReport(syncConfig.NotionAPIKey, reportNotionPageId, params.Children)
	if err != nil {
		return fmt.Errorf("failed to create page: %v", err)
	}

	return nil
}

func displayDiff(diff int) string {
	if diff >= 0 {
		return "+" + strconv.Itoa(diff)
	}
	return strconv.Itoa(diff)
}

func displayDiffColor(diff int) notion.Color {
	if diff < 0 {
		return notion.ColorOrange
	}
	return notion.ColorBlue
}

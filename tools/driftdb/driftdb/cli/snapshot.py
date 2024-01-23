import base64
import os
import webbrowser

import inquirer
import pkg_resources
import typer
from driftdb.dbt.snapshot import get_snapshot_dates, get_snapshot_diff, get_snapshot_nodes

from ..alerting.handlers import alert_drift_handler
from ..dbt.snapshot_to_drift import convert_snapshot_to_drift_summary
from .common import get_user_date_selection

app = typer.Typer()


@app.command()
def show(snapshot_id: str = typer.Option(None, help="id of your snapshot")):
    snapshot_nodes = get_snapshot_nodes()
    snapshot_node = get_or_prompt_snapshot_node(snapshot_id, snapshot_nodes)
    snapshot_dates = get_snapshot_dates(snapshot_node)

    snapshot_date = get_user_date_selection(snapshot_dates)

    diff = get_snapshot_diff(snapshot_node, snapshot_date)

    spa_html_path = pkg_resources.resource_filename(__name__, "../spa/snapshot/index.html")

    with open(spa_html_path, "r", encoding="utf-8") as spa_html_file:
        spa_html_code = spa_html_file.read()

    json_diff = diff.to_json(date_format="iso")

    encoded_diff = base64.b64encode(json_diff.encode("utf-8"))
    b64string_diff = encoded_diff.decode("utf-8")
    compiled_output_html = (
        f"<script>" f"window.generated_diff = JSON.parse(atob('{b64string_diff}'));" f"</script>" f"{spa_html_code}"
    )

    with open("diff.html", "w") as f:
        f.write(compiled_output_html)

    html_file_path = os.path.abspath("diff.html")

    webbrowser.open("file://" + html_file_path)


@app.command()
def check(snapshot_id: str = typer.Option(None, help="id of your snapshot")):
    snapshot_node = get_or_prompt_snapshot_node(snapshot_id, get_snapshot_nodes())
    snapshot_date = get_user_date_selection(get_snapshot_dates(snapshot_node))

    print(f"Getting {snapshot_node['unique_id']} for {snapshot_date}.")
    diff = get_snapshot_diff(snapshot_node, snapshot_date)
    context = convert_snapshot_to_drift_summary(snapshot_diff=diff, id_column="month", date_column="month")

    drift_summary = context.summary
    print("added_rows \n", drift_summary["added_rows"].to_markdown())
    print("deleted_rows \n", drift_summary["deleted_rows"].to_markdown())
    print("modified_patterns \n", drift_summary["modified_patterns"].to_markdown())
    print("modified_rows_unique_keys \n", drift_summary["modified_rows_unique_keys"])

    alerts = alert_drift_handler(context)
    print("alerts \n", alerts.should_alert)
    print("alerts \n", alerts.message)


def get_or_prompt_snapshot_node(snapshot_id, snapshot_nodes):
    if not snapshot_id:
        questions = [
            inquirer.List(
                "choice",
                message="Please choose a snapshot to show",
                choices=[node["unique_id"] for node in snapshot_nodes],
            ),
        ]
        answers = inquirer.prompt(questions)
        if answers is None:
            typer.echo("No choice selected. Exiting.")
            raise typer.Exit(code=1)

        snapshot_id = answers["choice"]

    snapshot_node = [node for node in snapshot_nodes if node["unique_id"] == snapshot_id][0]
    return snapshot_node


if __name__ == "__main__":
    app()

import axios from "axios";
import { MetricCohortsResults } from "./data-drift.types";
import { Endpoints } from "@octokit/types";

export interface CommitParam {
  owner: string;
  repo: string;
  commitSHA: string;
}

const encodedPassword = localStorage.getItem("basic_auth");

if (encodedPassword) {
  axios.defaults.headers.common["Authorization"] = `Basic ${encodedPassword}`;
}

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.response && error.response.status === 401) {
      const password = window.prompt("Enter password");
      if (password) {
        const encodedPassword = btoa(password);
        localStorage.setItem("basic_auth", encodedPassword);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Basic ${encodedPassword}`;
      }
    }

    return Promise.reject(error);
  }
);

const DATA_DRIFT_API_URL =
  String(import.meta.env.VITE_DATADRIFT_SERVER_URL) || "";

export const getPatchAndHeader = async (params: CommitParam) => {
  const result = await axios.get<{
    patch: string;
    headers: string[];
    commitLink: string;
    date: string;
    filename: string;
    patchToLarge: boolean;
  }>(
    `${DATA_DRIFT_API_URL}/gh/${params.owner}/${params.repo}/commit/${params.commitSHA}`
  );
  return {
    patch: result.data.patch,
    headers: result.data.headers,
    commitLink: result.data.commitLink,
    date: new Date(result.data.date),
    filename: result.data.filename,
    patchToLarge: result.data.patchToLarge,
  };
};

export const getMeasurement = async (
  store: string,
  tableId: string,
  measurementId: string
) => {
  const result = await axios.get<{
    MeasurementMetaData: {
      MeasurementTimestamp: number;
      MeasurementDate: string;
      MeasurementDateTime: string;
      MeasurementComments: {
        CommentAuthor: string;
        CommentBody: string;
      }[];
      MeasurementId: string;
    };
    Patch: string;
    Headers: string[];
  }>(
    `${DATA_DRIFT_API_URL}/stores/${store}/tables/${tableId}/measurements/${measurementId}`
  );
  return result;
};

export const getMetricCohorts = async ({
  installationId,
  owner,
  repo,
  metricName,
  timegrain,
}: {
  installationId?: string;
  owner?: string;
  repo?: string;
  metricName: string;
  timegrain: Timegrain;
}) => {
  if (owner && repo) {
    const result = await axios.get<MetricCohortsResults>(
      `${DATA_DRIFT_API_URL}/gh/${owner}/${repo}/metrics/${metricName}/cohorts/${timegrain}`
    );
    return result;
  }
  const result = await axios.get<MetricCohortsResults>(
    `${DATA_DRIFT_API_URL}/metrics/${metricName}/cohorts/${timegrain}`,
    { headers: { "Installation-Id": installationId } }
  );
  return result;
};

export const getCommitList = async (
  params: {
    owner: string;
    repo: string;
  },
  date?: string
) => {
  const result = await axios.get<
    Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]["data"]
  >(`${DATA_DRIFT_API_URL}/gh/${params.owner}/${params.repo}/commits`, {
    params: { date },
  });

  return result;
};

export const getCommitListLocalStrategy = async (
  tableId: string,
  date?: string
) => {
  const store = "default";

  const result = await axios.get<{
    Measurements: {
      Message: string;
      Date: string;
      Sha: string;
    }[];
  }>(`${DATA_DRIFT_API_URL}/stores/${store}/tables/${tableId}/measurements`, {
    params: { date },
  });

  return result;
};

// Define the custom type
export type Timegrain = "year" | "quarter" | "month" | "week" | "day";

// The assertion function
export function assertTimegrain(value: string): asserts value is Timegrain {
  if (
    value !== "year" &&
    value !== "quarter" &&
    value !== "month" &&
    value !== "week" &&
    value !== "day"
  ) {
    throw new Error("Value is not a valid time unit!");
  }
}

type YearString = `${number}`;
type YearMonthString = `${number}-${string & { length: 2 }}`;
type YearMonthDayString = `${number}-${string & { length: 2 }}-${string & {
  length: 2;
}}`;
type YearWeekString = `${number}-W${
  | (number & { length: 1 })
  | (string & { length: 2 })}`;
type YearQuarterString = `${number}-Q${1 | 2 | 3 | 4}`;
export type TimegrainString =
  | YearString
  | YearMonthString
  | YearMonthDayString
  | YearWeekString
  | YearQuarterString;

export function assertStringIsTimgrainString(
  str: string
): asserts str is TimegrainString {
  if (
    str.match(/^\d{4}$/) !== null ||
    str.match(/^\d{4}-\d{2}$/) !== null ||
    str.match(/^\d{4}-\d{2}-\d{2}$/) !== null ||
    str.match(/^\d{4}-W\d{1,2}$/) !== null ||
    str.match(/^\d{4}-Q[1-4]$/) !== null
  ) {
    return;
  } else {
    throw new Error("Invalid timegrain string!");
  }
}

export function getTimegrainFromString(str: TimegrainString): Timegrain {
  if (str.match(/^\d{4}$/) !== null) {
    return "year";
  } else if (str.match(/^\d{4}-\d{2}$/) !== null) {
    return "month";
  } else if (str.match(/^\d{4}-\d{2}-\d{2}$/) !== null) {
    return "day";
  } else if (str.match(/^\d{4}-W\d{1,2}$/) !== null) {
    return "week";
  } else if (str.match(/^\d{4}-Q[1-4]$/) !== null) {
    return "quarter";
  } else {
    throw new Error("Invalid timegrain string!");
  }
}

export const getMetricReport = async ({
  installationId,
  metricName,
  owner,
  repo,
}: {
  installationId?: string;
  owner?: string;
  repo?: string;
  metricName: string;
  timegrain: Timegrain;
}) => {
  if (owner && repo) {
    const result = await axios.get<MetricReport>(
      `${DATA_DRIFT_API_URL}/gh/${owner}/${repo}/metrics/${metricName}/reports`
    );
    return result;
  }
  const result = await axios.get<MetricReport>(
    `${DATA_DRIFT_API_URL}/metrics/${metricName}/reports`,
    { headers: { "Installation-Id": installationId } }
  );
  return result;
};

export type TimegrainAndDimensionString = `${TimegrainString}-${string}`;

export type MetricReport = Record<
  TimegrainString | TimegrainAndDimensionString,
  PeriodReport | undefined
>;

type CommitSha = string;
export interface PeriodReport {
  TimeGrain: Timegrain;
  Period: TimegrainString;
  Dimension: string;
  DimensionValue: string;
  History: { [key: CommitSha]: History };
}

interface History {
  Lines: number;
  KPI: string;
  CommitTimestamp: number;
  CommitDate: string;
  IsAfterPeriod: boolean;
  CommitUrl: string;
  CommitComments: CommitComment[] | null;
}

interface CommitComment {
  CommentAuthor: string;
  CommentBody: string;
}

export const ddCommitDiffUrlFactory = (params: {
  owner: string;
  repo: string;
  commitSha: string;
}) => {
  return `/report/${params.owner}/${params.repo}/commit/${params.commitSha}`;
};

export type DDConfigMetric = {
  filepath: string;
  upstreamFiles?: string[] | null;
  dateColumnName: string;
  KPIColumnName: string;
  metricName: string;
  timeGrains: string[];
  dimensions: string[];
};

export type DDConfig = {
  metrics: DDConfigMetric[];
};

const getConfigFromApi = async (params: { owner: string; repo: string }) => {
  const result = await axios.get<{ config: DDConfig }>(
    `${DATA_DRIFT_API_URL}/config/${params.owner}/${params.repo}`
  );
  return result.data.config;
};

export const configQuery = (params: { owner: string; repo: string }) => ({
  queryKey: ["config", params.owner, params.repo],
  queryFn: () => getConfigFromApi(params),
});

export const getTableList = async () => {
  const result = await axios.get<{
    store: string;
    tables: string[];
  }>(`${DATA_DRIFT_API_URL}/stores/default/tables`);
  return result;
};

export const getTable = async (tableId: string) => {
  const result = await axios.get<{
    commits: {
      Message: string;
      Date: string;
      Sha: string;
    }[];
    store: string;
    table: string;
    tableColumns: string[];
  }>(`${DATA_DRIFT_API_URL}/stores/default/tables/${tableId}`);
  return result;
};

export const getMetricHistory = async (params: {
  store: string;
  table: string;
  metric: string;
  periodKey: string;
}) => {
  const { store, table: tableId, metric, periodKey } = params;
  const result = await axios.post<{
    metricHistory: {
      LineCount: number;
      Metric: string;
      IsMeasureAfterPeriod: boolean;
      MeasurementMetaData: {
        MeasurementTimestamp: number;
        MeasurementDate: string;
        MeasurementDateTime: string;
        MeasurementComments: {
          CommentAuthor: string;
          CommentBody: string;
        }[];

        MeasurementId: string;
      };
    }[];
    periodKey: string;
    store: string;
    table: string;
  }>(`${DATA_DRIFT_API_URL}/stores/${store}/tables/${tableId}/metrics`, {
    metric,
    period: periodKey,
  });
  return result;
};

export const getTableComparisonFromApi = async (params: {
  owner: string;
  repo: string;
  beginDate: string;
  endDate: string;
  table: string;
}) => {
  const { owner, repo, beginDate, endDate, table } = params;
  try {
    const comparison = await axios.get<{
      patch: string;
      headers: string[];
      filename: string;
      patchToLarge: boolean;
      baseCommitDateISO8601: string;
      headCommitDateISO8601: string;
    }>(
      `${DATA_DRIFT_API_URL}/gh/${owner}/${repo}/compare-between-date?start-date=${beginDate}&end-date=${endDate}&table=${table}`
    );
    return comparison;
  } catch (err) {
    if (axios.isAxiosError<{ error: string }>(err)) {
      throw new Error(err?.response?.data?.error);
    }

    throw err;
  }
};

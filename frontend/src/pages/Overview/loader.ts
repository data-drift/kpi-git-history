import { Params, useLoaderData } from "react-router-dom";
import { DDConfig, configQuery, getConfig } from "../../services/data-drift";
import { QueryClient } from "@tanstack/react-query";

enum Strategy {
  Github = "github",
  Local = "local",
}
function assertParamsIsDefined(
  params: Params<"owner" | "repo">
): asserts params is { owner: string; repo: string } {
  if (
    typeof params.owner === "string" &&
    params.owner.trim() !== "" &&
    typeof params.repo === "string" &&
    params.repo.trim() !== ""
  ) {
    return;
  }
  throw new Error("Params is not defined");
}

export const loader =
  (queryClient: QueryClient) =>
  async ({ params }: { params: Params<"owner" | "repo"> }) => {
    console.log(queryClient);
    assertParamsIsDefined(params);
    const query = configQuery(params);
    const maybeConfig = queryClient.getQueryData<DDConfig>(query.queryKey);
    const config =
      maybeConfig !== undefined
        ? maybeConfig
        : await queryClient.fetchQuery(query);

    return {
      params,
      config,
      strategy: Strategy.Github,
    } as const;
  };

export const localStrategyLoader = ({
  params,
}: {
  params: Params<"tableName">;
}) => {
  const tableName = params.tableName || "";

  const config: DDConfig = {
    metrics: [
      {
        metricName: tableName,
        filepath: tableName,
        upstreamFiles: [],
        dateColumnName: "",
        KPIColumnName: "",
        timeGrains: [],
        dimensions: [],
      },
    ],
  };

  return {
    params: { ...params, tableName },
    config,
    strategy: Strategy.Local,
  } as const;
};

type LoaderData = Awaited<
  ReturnType<ReturnType<typeof loader> | typeof localStrategyLoader>
>;

function assertLoaderDataIsDefined(
  loaderData: unknown
): asserts loaderData is LoaderData {
  if (typeof loaderData === "object" && loaderData !== null) {
    return;
  }
  throw new Error("Loader data is not defined");
}

export const useOverviewLoaderData = () => {
  const loaderData = useLoaderData();
  assertLoaderDataIsDefined(loaderData);
  return loaderData;
};

import styled from "@emotion/styled";
import TrendChip from "../components/Charts/TrendChip";
import DualMetricBarChart from "../components/Charts/DualMetricBarChart";
import StarUs from "../components/Common/StarUs";

const PageContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 0 ${({ theme }) => theme.spacing(6)};
  align-items: flex-start;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Separator = styled.div`
  width: 100%;
  border-bottom: 1px solid ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const DriftDetailContainer = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background2};
  padding: ${({ theme }) => theme.spacing(2)};
  box-sizing: border-box;
  clip-path: ${({ theme }) => theme.upLeftClipping};
  display: flex;
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(20)};
  overflow: visible;
`;

const SubSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const BlackContainer = styled.div`
  width: 100%;
  background-color: black;
  padding: ${({ theme }) => theme.spacing(2)};
  box-sizing: border-box;
  margin-top: ${({ theme }) => theme.spacing(2)};
  text-align: start;
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const DrillDownButton = styled.button`
  padding: 8px 16px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: black;
  border-radius: 0px;
  font-family: monospace;
  margin-left: auto;
  margin-top: auto;
  display: flex;
  flex-direction: row;
`;

const TansparentContainer = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)} 0;
  box-sizing: border-box;
  margin-top: ${({ theme }) => theme.spacing(2)};
  text-align: start;
`;

const DualBarChartContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const data = [
  {
    name: "MRR Jan 2023",
    before: 78543,
    after: 79527,
    percentageChange: 1.27,
  },
  {
    name: "MRR Feb 2023",
    before: 93217,
    after: 91810,
    percentageChange: -1.54,
  },
  {
    name: "MRR Mar 2023",
    before: 70896,
    after: 70896,
    percentageChange: 0.0,
  },
  {
    name: "MRR Apr 2023",
    before: 88462,
    after: 90125,
    percentageChange: 1.89,
  },
  {
    name: "MRR May 2023",
    before: 76320,
    after: 75824,
    percentageChange: -0.63,
  },
  {
    name: "MRR Jun 2023",
    before: 95102,
    after: 95840,
    percentageChange: 0.78,
  },
  {
    name: "MRR Jul 2023",
    before: 81737,
    after: 81737,
    percentageChange: 0.0,
  },
  {
    name: "MRR Aug 2023",
    before: 92865,
    after: 91835,
    percentageChange: -1.12,
  },
  {
    name: "MRR Sep 2023",
    before: 84501,
    after: 85656,
    percentageChange: 1.36,
  },
  {
    name: "MRR Oct 2023",
    before: 97234,
    after: 97234,
    percentageChange: 0.0,
  },
];

const StyledHeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
`;

const DriftOverviewPage = () => {
  return (
    <PageContainer>
      <StyledHeaderContainer>
        <h1>MRR - Definition Update</h1>
        <div style={{ paddingTop: "24px" }}>
          <StarUs />
        </div>
      </StyledHeaderContainer>
      <Separator />
      <DriftDetailContainer>
        <SubSectionContainer>
          <strong>Current Drift</strong>
          <TansparentContainer>
            Detected on {new Date().toLocaleDateString()}
          </TansparentContainer>
          <TansparentContainer>7 month impacted</TansparentContainer>
          <BlackContainer>
            Total drift:<strong>48.9</strong>{" "}
            <span style={{ marginLeft: "auto", paddingLeft: "8px" }}>
              <TrendChip trend="up" absoluteValue={2} />
            </span>
          </BlackContainer>
        </SubSectionContainer>
        <SubSectionContainer>
          <strong>Owner</strong>
          <TansparentContainer>Aya Nakamura</TansparentContainer>
        </SubSectionContainer>
        <DrillDownButton
          onClick={() => {
            window.location.href =
              "/41231518/samox/dbt-example/overview?commitSha=37467fb6ce76d26fad8b09d7582ed3f6ad5d61e3&snapshotDate=2023-10-18";
          }}
        >
          <strong> DRILL DOWN</strong>
        </DrillDownButton>
      </DriftDetailContainer>
      <DualBarChartContainer>
        <DualMetricBarChart data={data} />
      </DualBarChartContainer>
    </PageContainer>
  );
};

export default DriftOverviewPage;

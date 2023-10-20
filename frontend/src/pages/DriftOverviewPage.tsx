import styled from "@emotion/styled";

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
`;

const MetadataContainer = styled.div`
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
`;

const TansparentContainer = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)} 0;
  box-sizing: border-box;
  margin-top: ${({ theme }) => theme.spacing(2)};
  text-align: start;
`;

const DriftOverviewPage = () => {
  return (
    <PageContainer>
      <h1>Drift overview</h1>
      <Separator />
      <DriftDetailContainer>
        <MetadataContainer>
          <strong>Metric Metadata</strong>
          <BlackContainer>Stabilization time: 3d</BlackContainer>
          <BlackContainer>Volatility: 1%</BlackContainer>
        </MetadataContainer>
        <MetadataContainer>
          <strong>Current Drift</strong>
          <TansparentContainer>
            Detected on {new Date().toLocaleDateString()}
          </TansparentContainer>
          <TansparentContainer>4 month impacted</TansparentContainer>
          <BlackContainer>
            Total drift <strong>48.9</strong>
          </BlackContainer>
        </MetadataContainer>
      </DriftDetailContainer>
    </PageContainer>
  );
};

export default DriftOverviewPage;

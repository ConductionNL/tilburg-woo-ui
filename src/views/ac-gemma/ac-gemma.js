import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { AcContainer } from '@atoms';
import { withStore } from '@stores';
import { dia, shapes } from 'jointjs';
import { ViewRenderer, ViewSettings } from '@arktect-co/archimate-diagram-engine';

const AcGemma = ({ store: { gemma } }) => {
  useEffect(() => {
    // Create container in HTML
    const container = document.getElementById('graph-container');

    // Initialize the graph
    let outputGraph = new dia.Graph({}, { cellNamespace: shapes });

    // Create paper for rendering
    const paper = new dia.Paper({
      el: container,
      model: outputGraph,
      width: '100%',
      height: 800,
      gridSize: 1,
    });

    // Define nodes
    const viewNodes = [
      {
        modelNodeId: 'c66f4f1de7ef4b28a5aafdbd497a2aff',
        viewNodeId: 'ea00a3ff03f541fabc96f78348b55955',
        name: 'Data-object',
        type: 'dataobject',
        x: 500,
        y: 350,
        width: 100,
        height: 60,
        parent: null,
      },
      {
        modelNodeId: '4ff521e69d724ae88c5a2324008613e7',
        viewNodeId: '222f9942c68e47d5a7167e64cc435b8a',
        name: 'Artifact',
        type: 'artifact',
        x: 500,
        y: 200,
        width: 100,
        height: 60,
        parent: null,
      },
      {
        modelNodeId: '2339be41-cfcd-4496-820d-ce823a6d9ea4',
        viewNodeId: '3942f672-c45d-47b5-90f5-a7d117d53bf3',
        name: 'Applicatiefunctie',
        type: 'applicationfunction',
        x: 300,
        y: 350,
        width: 100,
        height: 60,
        parent: null,
      },
      {
        modelNodeId: 'dbfc43a4-5002-4619-8d15-b2b0fc940135',
        viewNodeId: '7b650e5c-fd1f-4897-b4ba-eaba0266ca36',
        name: 'Applicatieservice',
        type: 'applicationservice',
        x: 500,
        y: 500,
        width: 100,
        height: 60,
        parent: null,
      },
      {
        modelNodeId: 'bf2f547c-d9a3-47e5-b407-b2dcced24074',
        viewNodeId: '79851822-319d-483f-bcc1-1aa4c14a04a8',
        name: 'Bedrijfsobject',
        type: 'businessobject',
        x: 700,
        y: 350,
        width: 100,
        height: 60,
        parent: null,
      },
    ];

    // Define relationships
    let viewRelationships = [
      {
        modelRelationshipId: '790f2145455347d089d7afc34f6fba45',
        sourceId: '222f9942c68e47d5a7167e64cc435b8a',
        targetId: 'ea00a3ff03f541fabc96f78348b55955',
        viewRelationshipId: '42c4085e-b2c8-4cb9-803f-3b5ab827d644',
        type: 'realization',
      },
      {
        modelRelationshipId: '40e8eadd-cb9a-4046-8f39-59247e1c433f',
        sourceId: 'ea00a3ff03f541fabc96f78348b55955',
        targetId: '3942f672-c45d-47b5-90f5-a7d117d53bf3',
        viewRelationshipId: 'c8684fc5137444c09ce193268abfcb97',
        isBidirectional: true,
        type: 'access',
      },
      {
        modelRelationshipId: 'a0417565-43ce-4871-a533-da278ac3c76d',
        sourceId: '7b650e5c-fd1f-4897-b4ba-eaba0266ca36',
        targetId: 'ea00a3ff03f541fabc96f78348b55955',
        viewRelationshipId: 'e4eb4119-2585-4dcf-a9cb-91728db6d99b',
        type: 'access',
      },
      {
        modelRelationshipId: '6101f2e7-3685-4d21-9478-0670d1332447',
        sourceId: 'ea00a3ff03f541fabc96f78348b55955',
        targetId: '79851822-319d-483f-bcc1-1aa4c14a04a8',
        viewRelationshipId: '415bc55b-eaa2-4ae1-9038-5548ca689a09',
        type: 'realization',
      },
    ];

    // Create settings
    const settings = new ViewSettings({
      archimateVersion: '<=3.1',
      style: 'hybrid',
      darkColor: 'black',
      lightColor: 'white',
      textColor: 'black',
      textSize: 12,
      defaultWidth: 140,
      defaultHeight: 50,
      borderWidth: 0.8,
      edgeWidth: 0.8,
    });

    // Render the graph
    ViewRenderer.renderToGraph(
      outputGraph,
      viewNodes,
      viewRelationships,
      new ViewSettings({
        archimateVersion: '<=3.1',
        style: 'hybrid',
        darkColor: 'black',
        lightColor: 'white',
        textColor: 'black',
        textSize: 12,
        defaultWidth: 140,
        defaultHeight: 50,
        borderWidth: 0.8,
        edgeWidth: 0.8,
      })
    );
  }, []);

  return (
    <AcContainer spacing='lg'>
      <h1>Architectuur plaat</h1>
      <div className='ac-gemma-graph-container' id='graph-container'></div>
    </AcContainer>
  );
};

export default withStore(observer(AcGemma));

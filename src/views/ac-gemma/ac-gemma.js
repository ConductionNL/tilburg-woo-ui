import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AcContainer } from '@atoms';
import { withStore } from '@stores';
import { dia, shapes } from 'jointjs';
import { ViewRenderer, ViewSettings } from '@arktect-co/archimate-diagram-engine';
import {
  Select,
  SelectOption,
} from '@utrecht/component-library-react/dist/css-module';
import { AcLoader } from '@components';

const AcGemma = ({ store: { gemma } }) => {
  const { fetchViews, resetViews, fetchView, resetView } = gemma;
  const [view, setView] = useState(null);
  const [viewNodesNames, setViewNodesNames] = useState(null);

  useEffect(() => {
    fetchViews();
    setViewNodesNames(null);
    return () => resetViews();
  }, []);

  useEffect(() => {
    if (!view) return;

    setViewNodesNames(null);

    fetchView(view);
    return () => {
      resetView();
    };
  }, [view]);

  useEffect(() => {
    if (!gemma.get_view) return;
    let viewNodesNames = [];

    var getViewNodesNames = new Promise((resolve, reject) => {
      gemma.get_view.node.forEach(async (node, index, array) => {
        const response = await fetch(
          `https://vng.accept.commonground.nu/apps/openconnector/api/endpoint/elements?identifier=${node.elementRef}`
        );
        const data = await response.json();
        viewNodesNames.push(data.results[0]?.name || 'unknown');
        if (index === array.length - 1) resolve();
      });
    });

    getViewNodesNames.finally(() => {
      console.info('Finished fetching view node names, applying after delay');
      setTimeout(() => {
        setViewNodesNames(viewNodesNames);
      }, 1000);
    });
  }, [gemma.get_view]);

  useEffect(() => {
    if (!gemma.get_view) return;
    if (!viewNodesNames) return;

    // Create container in HTML
    const container = document.getElementById('graph-container');

    // Initialize the graph
    let outputGraph = new dia.Graph({}, { cellNamespace: shapes });

    // Create paper for rendering
    const paper = new dia.Paper({
      el: container,
      model: outputGraph,
      width: 1168,
      height: 800,
      gridSize: 1,
    });

    const convertToViewNode = (node, idx) => {
      const type =
        viewNodesNames[idx] === 'StUF Geo IMGeo' ? 'constraint' : 'dataobject';
      return {
        modelNodeId: node.elementRef,
        viewNodeId: node.identifier || 'unknown',
        name: viewNodesNames[idx] || 'unknown',
        type: type,
        x: node.position.x,
        y: node.position.y,
        width: node.position.w,
        height: node.position.h,
        parent: null,
        color: `rgba(${node.style.fillColor.r}, ${node.style.fillColor.g}, ${node.style.fillColor.b}, ${node.style.fillColor.a})`,
        borderColor: `rgba(${node.style.lineColor.r}, ${node.style.lineColor.g}, ${node.style.lineColor.b}, ${node.style.lineColor.a})`,
        font: {
          name: node.style.font.name,
          size: node.style.font.size,
          color: `rgba(${node.style.font.color.r}, ${node.style.font.color.g}, ${node.style.font.color.b}, ${node.style.font.color.a})`,
        },
      };
    };

    const viewNodes = gemma.get_view.node.map(convertToViewNode);

    const convertToViewRelationship = (relationship) => {
      if (!relationship.relationshipRef) return;

      return {
        modelRelationshipId: relationship.relationshipRef,
        sourceId: relationship.source,
        targetId: relationship.target,
        viewRelationshipId: relationship.identifier,
        type: 'access',
      };
    };

    const viewRelationshipsArray = gemma.get_view.connection.map(
      convertToViewRelationship
    );

    const viewRelationships = viewRelationshipsArray.filter(
      (relationship) => relationship !== undefined
    );


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

    viewNodes.forEach((node) => {
      setNodeColor(node);
    });

    container.querySelectorAll(':scope > svg').forEach((node) => {
      setSvgViewBox(node);
    });
  }, [viewNodesNames]);

  const setSvgViewBox = (svg) => {
    const box = svg.querySelector('g').getBBox();
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
  };

  const setNodeColor = (node) => {
    const parentElement = document.querySelector(`[model-id="${node.viewNodeId}"]`);
    let allRectElements = parentElement.querySelectorAll(':scope > rect');
    allRectElements.forEach((item) => item.setAttribute('fill', node.color));
    allRectElements.forEach((item) => item.setAttribute('stroke', node.borderColor));

    let allTextElements = parentElement.querySelectorAll(':scope > text');

    allTextElements.forEach((item) =>
      item.setAttribute('font-family', node.font.name)
    );
    allTextElements.forEach((item) =>
      item.setAttribute('font-size', node.font.size)
    );
    allTextElements.forEach((item) =>
      item.setAttribute('font-color', node.font.color)
    );
  };

  return (
    <AcContainer spacing='lg'>
      {gemma.all_views?.length === 0 && <AcLoader />}
      {gemma.all_views?.length > 0 && (
        <>
          <Select
            id='sorting'
            className='ac-gemma-select'
            onChange={(e) => setView(e.target.value)}
            loading={gemma.all_views.length === 0}
          >
            <SelectOption value=''>Selecteer een view</SelectOption>
            {gemma.all_views.map((view) => (
              <SelectOption value={view.id}>{view.name}</SelectOption>
            ))}
          </Select>

          {gemma.get_view && <h1>{gemma.get_view.name}</h1>}

          {gemma.get_view && viewNodesNames && (
            <div className='ac-gemma-graph-container' id='graph-container'></div>
          )}
          {!gemma.get_view && !viewNodesNames && (
            <div className='ac-gemma-graph-container-loading' />
          )}
          {gemma.get_view && !viewNodesNames && (
            <div className='ac-gemma-graph-container-loading'>
              <AcLoader className='ac-gemma-graph-container-loading-loader' />
            </div>
          )}
        </>
      )}
    </AcContainer>
  );
};

export default withStore(observer(AcGemma));

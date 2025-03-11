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
import { TOOLTIP_ID } from '@src/index.web';

const AcGemma = ({ store: { gemma } }) => {
  const { fetchViews, resetViews, fetchView, resetView } = gemma;
  const [view, setView] = useState(null);
  const [viewNodesData, setViewNodesData] = useState(null);

  useEffect(() => {
    fetchViews();
    setViewNodesData(null);
    return () => resetViews();
  }, []);

  useEffect(() => {
    if (!view) return;

    setViewNodesData(null);

    fetchView(view);
    return () => {
      resetView();
    };
  }, [view]);

  useEffect(() => {
    if (!gemma.get_view) return;
    let viewNodesData = [];

    var getViewNodesNames = new Promise((resolve, reject) => {
      gemma.get_view.node.forEach(async (node, index, array) => {
        const response = await fetch(
          `https://vng.accept.commonground.nu/apps/openconnector/api/endpoint/elements?identifier=${node.elementRef}`
        );
        const data = await response.json();
        viewNodesData.push({
          name: data.results[0]?.name || 'unknown',
          id: node.elementRef,
          description: data.results[0]?.documentation || 'unknown',
        });
        if (index === array.length - 1) resolve();
      });
    });

    getViewNodesNames.finally(() => {
      console.info('Finished fetching view node names, applying after delay');
      setTimeout(() => {
        setViewNodesData(viewNodesData);
      }, 1000);
    });
  }, [gemma.get_view]);

  useEffect(() => {
    if (!gemma.get_view) return;
    if (!viewNodesData) return;

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
      interactive: false,
      elementMove: false,
    });

    const convertToViewNode = (node) => {
      const nodeData = viewNodesData.find((item) => item.id === node.elementRef);

      const getType = () => {
        switch (nodeData.name) {
          case 'StUF Geo IMGeo':
            return 'constraint';
          case 'SVB-BGT services en portaal':
            return 'applicationcomponent';
          default:
            return 'dataobject';
        }
      };

      return {
        modelNodeId: node.elementRef,
        viewNodeId: node.identifier || 'unknown',
        name: nodeData?.name || 'unknown',
        type: getType(),
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
        description: nodeData?.description || 'unknown',
      };
    };

    const viewNodes = gemma.get_view.node.map(convertToViewNode);

    const convertToViewRelationship = (relationship) => {
      if (!relationship.relationshipRef) return;

      const bendpoints =
        relationship.source === 'id-36645' && relationship.target === 'id-36642'
          ? [{ x: 210, y: 130 }]
          : [];
      return {
        modelRelationshipId: relationship.relationshipRef,
        sourceId: relationship.source,
        targetId: relationship.target,
        viewRelationshipId: relationship.identifier,
        type: 'access',
        bendpoints,
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
        interactive: false,
      })
    );

    viewNodes.forEach((node) => {
      setNodeColor(node);
    });

    container.querySelectorAll(':scope > svg').forEach((node) => {
      setSvgViewBox(node);
    });
  }, [viewNodesData]);

  const setSvgViewBox = (svg) => {
    const box = svg.querySelector('g').getBBox();
    svg.setAttribute('id', 'svg-container');
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);

    // Add styles for scrolling/zooming
    svg.style.width = '100%';
    svg.style.height = '800px';
    svg.style.border = '1px solid #ccc';
    svg.style.cursor = 'grab';

    // Initialize the transform group if it doesn't exist
    const existingGroup = svg.querySelector('g');
    if (existingGroup) {
      existingGroup.setAttribute('transform', `translate(0, 0) scale(1)`);
    }

    // Add event listeners after SVG is ready
    svg.addEventListener('wheel', handleWheel);
    svg.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Add touch event listeners
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd);
  };

  const setNodeColor = (node) => {
    const parentElement = document.querySelector(`[model-id="${node.viewNodeId}"]`);
    parentElement.setAttribute('data-tooltip-id', TOOLTIP_ID);
    parentElement.setAttribute('data-tooltip-content', node.description);

    let allRectElements = parentElement.querySelectorAll(':scope > rect');
    allRectElements.forEach((item) => {
      item.setAttribute('fill', node.color);
      item.setAttribute('stroke', node.borderColor);
    });

    let allTextElements = parentElement.querySelectorAll(':scope > text');
    allTextElements.forEach((item) => {
      item.setAttribute('font-family', node.font.name);
      item.setAttribute('font-size', node.font.size);
      item.setAttribute('font-color', node.font.color);
    });
  };

  //////////////////// Scrolling ///////////////////////////
  const handleWheel = (event) => {
    event.preventDefault();
    const svg = document.getElementById('svg-container');
    if (!svg) return;

    const group = svg.querySelector('g');
    if (!group) return;

    const currentTransform =
      group.getAttribute('transform') || 'translate(0, 0) scale(1)';

    // Improved parsing of current transform values
    const scaleMatch = currentTransform.match(/scale\(([^\)]+)\)/);
    const translateMatch = currentTransform.match(
      /translate\(([^,]+),\s*([^\)]+)\)/
    );

    const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(currentScale * zoomFactor, 0.1), 10);

    group.setAttribute(
      'transform',
      `translate(${currentX}, ${currentY}) scale(${newScale})`
    );
  };

  const handleMouseDown = (event) => {
    const svg = event.target.closest('svg');
    if (!svg) return;

    svg.style.cursor = 'grabbing';
    const group = svg.querySelector('g');
    if (!group) return;

    const currentTransform =
      group.getAttribute('transform') || 'translate(0, 0) scale(1)';
    const translateMatch = currentTransform.match(
      /translate\(([^,]+),\s*([^\)]+)\)/
    );

    const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;

    svg.dataset.isDragging = 'true';
    svg.dataset.dragStartX = event.clientX - currentX;
    svg.dataset.dragStartY = event.clientY - currentY;
  };

  const handleMouseMove = (event) => {
    const svg = document.getElementById('svg-container');
    if (!svg || svg.dataset.isDragging !== 'true') return;

    const group = svg.querySelector('g');
    if (!group) return;

    const currentTransform =
      group.getAttribute('transform') || 'translate(0, 0) scale(1)';
    const scaleMatch = currentTransform.match(/scale\(([^\)]+)\)/);
    const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    const newX = event.clientX - parseFloat(svg.dataset.dragStartX);
    const newY = event.clientY - parseFloat(svg.dataset.dragStartY);

    group.setAttribute(
      'transform',
      `translate(${newX}, ${newY}) scale(${currentScale})`
    );
  };

  const handleMouseUp = () => {
    const svg = document.getElementById('svg-container');
    if (!svg) return;

    svg.style.cursor = 'grab';
    svg.dataset.isDragging = 'false';
  };

  // Add touch event handlers
  const handleTouchStart = (event) => {
    event.preventDefault();
    const svg = event.target.closest('svg');
    if (!svg) return;

    svg.style.cursor = 'grabbing';
    const group = svg.querySelector('g');
    if (!group) return;

    const currentTransform =
      group.getAttribute('transform') || 'translate(0, 0) scale(1)';
    const translateMatch = currentTransform.match(
      /translate\(([^,]+),\s*([^\)]+)\)/
    );

    const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
    const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;

    svg.dataset.isDragging = 'true';

    if (event.touches.length === 2) {
      // Store initial pinch distance for zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      svg.dataset.initialPinchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      svg.dataset.initialScale = currentTransform.match(/scale\(([^\)]+)\)/)
        ? parseFloat(currentTransform.match(/scale\(([^\)]+)\)/)[1])
        : 1;
    } else {
      // Store the current transform values and touch position
      svg.dataset.lastX = currentX.toString();
      svg.dataset.lastY = currentY.toString();
      svg.dataset.touchStartX = event.touches[0].clientX.toString();
      svg.dataset.touchStartY = event.touches[0].clientY.toString();
    }
  };

  const handleTouchMove = (event) => {
    event.preventDefault();
    const svg = document.getElementById('svg-container');
    if (!svg || svg.dataset.isDragging !== 'true') return;
  
    const group = svg.querySelector('g');
    if (!group) return;
  
    const currentTransform = group.getAttribute('transform') || 'translate(0, 0) scale(1)';
    const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^\)]+)\)/);
    const currentScale = currentTransform.match(/scale\(([^\)]+)\)/)
      ? parseFloat(currentTransform.match(/scale\(([^\)]+)\)/)[1])
      : 1;
  
    if (event.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentPinchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
  
      const initialPinchDistance = parseFloat(svg.dataset.initialPinchDistance);
      const initialScale = parseFloat(svg.dataset.initialScale);
      
      const scaleFactor = currentPinchDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.1), 10);
  
      // Get current position from translateMatch (which is now defined above)
      const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
      const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;
  
      group.setAttribute(
        'transform',
        `translate(${currentX}, ${currentY}) scale(${newScale})`
      );
    } else {
      // Handle single touch pan with smooth movement
      const speedMultiplier = 2;
      const deltaX = (event.touches[0].clientX - parseFloat(svg.dataset.touchStartX)) * speedMultiplier;
      const deltaY = (event.touches[0].clientY - parseFloat(svg.dataset.touchStartY)) * speedMultiplier;
      
      const newX = parseFloat(svg.dataset.lastX) + deltaX;
      const newY = parseFloat(svg.dataset.lastY) + deltaY;
  
      group.setAttribute(
        'transform',
        `translate(${newX}, ${newY}) scale(${currentScale})`
      );
    }
  };

  const handleTouchEnd = () => {
    const svg = document.getElementById('svg-container');
    if (!svg) return;

    // Store the final position before ending the drag
    const currentTransform = svg.querySelector('g')?.getAttribute('transform');
    if (currentTransform) {
      const translateMatch = currentTransform.match(
        /translate\(([^,]+),\s*([^\)]+)\)/
      );
      if (translateMatch) {
        svg.dataset.lastX = parseFloat(translateMatch[1]).toString();
        svg.dataset.lastY = parseFloat(translateMatch[2]).toString();
      }
    }

    svg.style.cursor = 'grab';
    svg.dataset.isDragging = 'false';
    delete svg.dataset.initialPinchDistance;
    delete svg.dataset.initialScale;
    delete svg.dataset.touchStartX;
    delete svg.dataset.touchStartY;
  };

  //////////////////// End Scrolling ///////////////////////////

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

          {gemma.get_view && viewNodesData && (
            <div className='ac-gemma-graph-container' id='graph-container'></div>
          )}
          {!gemma.get_view && !viewNodesData && (
            <div className='ac-gemma-graph-container-loading' />
          )}
          {gemma.get_view && !viewNodesData && (
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

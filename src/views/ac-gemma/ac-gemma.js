import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AcContainer } from '@atoms';
import { withStore } from '@stores';
import { dia, shapes } from 'jointjs';
// import { ViewRenderer, ViewSettings } from '@arktect-co/archimate-diagram-engine';
import { ViewRenderer, ViewSettings } from '@conduction/archimate-diagram-engine';
import {
  Select,
  SelectOption,
  PrimaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { AcLoader } from '@components';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import ReactSelect from 'react-select';
import clsx from 'clsx';

const AcGemma = ({ store: { gemma } }) => {
  const {
    fetchViews,
    resetViews,
    fetchView,
    resetView,
    fetchVoorzieningGebruik,
    resetVoorzieningGebruik,
    fetchAllVoorzieningGebruik,
    resetAllVoorzieningGebruik,
  } = gemma;
  const [view, setView] = useState(null);
  const [viewNodesData, setViewNodesData] = useState(null);
  const [viewRelationsData, setViewRelationsData] = useState(null);
  const [viewIsDoneLoading, setViewIsDoneLoading] = useState(false);
  const [voorzieningGebruikNodes, setVoorzieningGebruikNodes] = useState(null);

  useEffect(() => {
    fetchViews();
    setViewNodesData(null);
    setViewRelationsData(null);
    setViewIsDoneLoading(false);

    return () => resetViews();
  }, []);

  useEffect(() => {
    if (!view) return;

    setViewNodesData(null);
    setViewRelationsData(null);
    setViewIsDoneLoading(false);

    fetchAllVoorzieningGebruik();
    fetchView(view);
    return () => {
      resetView();
      resetAllVoorzieningGebruik();
    };
  }, [view]);

  useEffect(() => {
    if (!gemma.get_view) return;
    let viewNodesData = [];
    let viewRelationsData = [];

    const getViewNodesData = new Promise((resolve, reject) => {
      let forLoop = null;
      gemma.get_view.nodes.forEach(async (node, index, array) => {
        forLoop += 1;
        const response = await fetch(
          `https://vng.accept.commonground.nu/apps/openconnector/api/endpoint/elements?identifier=${node.elementRef}`
        );
        const data = await response.json();
        if (!data.results[0]) return;
        viewNodesData.push({
          name: data.results[0]?.name || 'unknown',
          id: node.elementRef,
          description: data.results[0]?.documentation || 'unknown',
          type: data.results[0]?.type || undefined,
        });
        if (index === array.length - 1 || forLoop === array.length) resolve();
      });
    });

    const getViewRelationsData = new Promise((resolve, reject) => {
      if (gemma.get_view.connections.length === 0) {
        resolve();
        return;
      }

      gemma.get_view.connections.forEach(async (relationship, index, array) => {
        const response = await fetch(
          `https://vng.accept.commonground.nu/apps/openconnector/api/endpoint/relationships?identifier=${relationship.relationshipRef}`
        );
        const data = await response.json();

        viewRelationsData.push({
          name:
            data.results[0]?.properties.find(
              (item) => item.propertyDefinitionRef === 'propid-62'
            )?.value || undefined,
          id: relationship.relationshipRef,
          type: data.results[0]?.type || undefined,
        });
        if (index === array.length - 1) resolve();
      });
    });

    getViewNodesData.finally(async () => {
      const voorzieningGebruik = new Promise((resolve, reject) => {
        const parentChildCount = {};

        gemma.get_allVoorzieningGebruik.forEach((item) => {
          item.referentieComponenten.forEach((ref) => {
            parentChildCount[ref] = (parentChildCount[ref] || 0) + 1;
          });
        });

        gemma.get_allVoorzieningGebruik.forEach((voorziening) => {
          voorziening.referentieComponenten.forEach((ref) => {
            const parentNode = gemma.get_view.nodes.find(
              (node) => node.elementRef === ref
            );

            if (!parentNode) return;

            const uniqueId = `${voorziening.id}_${ref}`;
            const childrenForThisParent = gemma.get_allVoorzieningGebruik.filter(
              (v) => v.referentieComponenten.includes(ref)
            );

            const childIndex = childrenForThisParent.findIndex(
              (v) => v.id === voorziening.id
            );
            const totalChildren = parentChildCount[ref];

            const PARENT_PADDING = 20;
            const CHILD_SPACING = 8;
            const parentWidth = parseInt(parentNode.position.w);
            const parentHeight = parseInt(parentNode.position.h);

            const childWidth = Math.min(
              (parentWidth -
                PARENT_PADDING * 2 -
                CHILD_SPACING * (totalChildren - 1)) /
                totalChildren,
              120 // Max width cap
            );
            const childHeight = Math.min(parentHeight * 0.35, 30);

            viewNodesData.push({
              name: voorziening.opmerkingen,
              id: uniqueId,
              viewNodeId: `${voorziening.id}_${ref}`,
              type: 'dataobject',
              position: {
                x: PARENT_PADDING + childIndex * (childWidth + CHILD_SPACING),
                y: parentHeight * 0.5,
                w: childWidth,
                h: childHeight,
              },
              font: parentNode.style.font,
              parent: parentNode.identifier,
            });
          });
        });

        resolve();
      });

      voorzieningGebruik.finally(() => {
        console.info('Finished fetching view node data, applying after delay');
        setTimeout(() => {
          setViewNodesData(viewNodesData);
        }, 1000);
      });
    });

    getViewRelationsData.finally(() => {
      console.info('Finished fetching view relations data, applying after delay');
      setTimeout(() => {
        if (gemma.get_view.connections.length > 0) {
          setViewRelationsData(viewRelationsData);
        } else {
          setViewRelationsData([]);
        }
      }, 2000);
    });
  }, [gemma.get_view]);

  useEffect(() => {
    if (!gemma.get_view) return;
    if (!gemma.get_allVoorzieningGebruik) return;
    if (!viewNodesData) return;
    if (!viewRelationsData) return;

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
      const nodeDataNode = viewNodesData.find((item) => item.id === node.elementRef);

      const getType = () => {
        switch (nodeDataNode?.name) {
          case 'StUF Geo IMGeo':
            return 'constraint';
          case 'SVB-BGT services en portaal':
            return 'applicationcomponent';
          default:
            return 'dataobject';
        }
      };

      if (!node.elementRef) {
        const nodes = node.referentieComponenten.map((refComponent) => {
          const uniqueId = `${node.id}_${refComponent}`;
          const nodeData = viewNodesData.find((item) => item.id === uniqueId);

          if (!nodeData) return;

          return {
            modelNodeId: nodeData?.id,
            viewNodeId: nodeData?.viewNodeId || 'unknown',
            name: nodeData?.name || 'unknown',
            type: nodeData?.type?.toLowerCase() || getType(),
            x: nodeData?.position?.x || 0,
            y: nodeData?.position?.y || 0,
            width: nodeData?.position?.w || 0,
            height: nodeData?.position?.h || 0,
            parent: null,
            description: nodeData?.description || null,
            font: nodeData?.font || null,
          };
        });

        return nodes;
      } else {
        return {
          modelNodeId: node.elementRef,
          viewNodeId: node.identifier || 'unknown',
          name: nodeDataNode?.name || 'unknown',
          type: nodeDataNode?.type?.toLowerCase() || getType(),
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
            color: `rgba(${node.style.color.r}, ${node.style.color.g}, ${node.style.color.b}, ${node.style.color.a})`,
          },
          description: nodeDataNode?.description || null,
        };
      }
    };

    const gemmaNodes = gemma.get_view.nodes;
    const voorzieningNodes = gemma.get_allVoorzieningGebruik;

    const allNodes = [...gemmaNodes, ...voorzieningNodes];

    const viewNodes = allNodes.flatMap(convertToViewNode).filter(Boolean);

    const convertToViewRelationship = (relationship, idx) => {
      const relationshipData = viewRelationsData.find(
        (item) => item.id === relationship.relationshipRef
      );

      return {
        modelRelationshipId: relationship.relationshipRef,
        sourceId: relationship.source,
        targetId: relationship.target,
        viewRelationshipId: relationship.identifier,
        type: relationshipData?.type?.toLowerCase() || 'access',
        bendpoints: relationship.bendpoints || [],
        label: {
          text: relationshipData?.name || undefined,
          ...(relationshipData?.name && {
            markup: [
              {
                style: {
                  fontSize: relationship.style.font.size,
                  fontFamily: relationship.style.font.name,
                  fontColor: `rgba(${relationship.style.color.r}, ${relationship.style.color.g}, ${relationship.style.color.b}, ${relationship.style.color.a})`,
                },
              },
            ],
          }),
        },
      };
    };

    const viewRelationshipsArray =
      gemma.get_view.connections.length > 0
        ? gemma.get_view.connections.map((relationship, idx) =>
            convertToViewRelationship(relationship, idx)
          )
        : [];

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

    viewNodes && viewRelationships && setViewIsDoneLoading(true);
  }, [viewNodesData, viewRelationsData]);

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
      node?.color && item.setAttribute('fill', node?.color);
      node?.borderColor && item.setAttribute('stroke', node?.borderColor);
    });

    let allTextElements = parentElement.querySelectorAll(':scope > text');
    allTextElements.forEach((item) => {
      node?.font?.name && item.setAttribute('font-family', node?.font?.name);
      node?.font?.size && item.setAttribute('font-size', node?.font?.size);
      node?.font?.color && item.setAttribute('font-color', node?.font?.color);
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
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const initialDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Only set initial distance if it's valid
      if (initialDistance && !isNaN(initialDistance) && initialDistance !== 0) {
        svg.dataset.initialPinchDistance = initialDistance.toString();
        const initialScale = currentTransform.match(/scale\(([^\)]+)\)/)
          ? parseFloat(currentTransform.match(/scale\(([^\)]+)\)/)[1])
          : 1;
        svg.dataset.initialScale = (
          isNaN(initialScale) ? 1 : initialScale
        ).toString();
      }
    } else {
      // Store the current transform values and touch position
      svg.dataset.lastX = (isNaN(currentX) ? 0 : currentX).toString();
      svg.dataset.lastY = (isNaN(currentY) ? 0 : currentY).toString();
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

    const currentTransform =
      group.getAttribute('transform') || 'translate(0, 0) scale(1)';
    const translateMatch = currentTransform.match(
      /translate\(([^,]+),\s*([^\)]+)\)/
    );
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

      // Add validation to prevent NaN
      if (
        initialPinchDistance &&
        !isNaN(initialPinchDistance) &&
        initialPinchDistance !== 0
      ) {
        const scaleFactor = currentPinchDistance / initialPinchDistance;
        let newScale = Math.min(Math.max(initialScale * scaleFactor, 0.1), 10);

        // Ensure newScale is a valid number
        if (isNaN(newScale)) {
          newScale = currentScale;
        }

        const currentX = translateMatch ? parseFloat(translateMatch[1]) : 0;
        const currentY = translateMatch ? parseFloat(translateMatch[2]) : 0;

        group.setAttribute(
          'transform',
          `translate(${currentX}, ${currentY}) scale(${newScale})`
        );
      }
    } else {
      // Handle single touch pan with smooth movement
      const speedMultiplier = 2.5;
      const deltaX =
        (event.touches[0].clientX - parseFloat(svg.dataset.touchStartX)) *
        speedMultiplier;
      const deltaY =
        (event.touches[0].clientY - parseFloat(svg.dataset.touchStartY)) *
        speedMultiplier;

      const newX = parseFloat(svg.dataset.lastX) + deltaX;
      const newY = parseFloat(svg.dataset.lastY) + deltaY;

      // Ensure currentScale is valid
      const safeScale = isNaN(currentScale) ? 1 : currentScale;

      group.setAttribute(
        'transform',
        `translate(${newX}, ${newY}) scale(${safeScale})`
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

  const downloadSvg = () => {
    const svg = document.getElementById('svg-container');
    if (!svg) return;

    // Create a clone of the SVG to modify
    const clonedSvg = svg.cloneNode(true);

    // Add XML declaration and SVG namespace
    const svgData = clonedSvg.outerHTML
      .replace(/&nbsp;/g, '&#160;')
      .replace(/xmlns=".*?"/g, '')
      .replace(/<svg /g, '<svg xmlns="http://www.w3.org/2000/svg" ');

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use view name if available, fallback to 'gemma' if not
    const fileName = (gemma.get_view?.name || 'gemma')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    a.download = `${fileName}.svg`;
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <AcContainer spacing='lg'>
      {gemma.all_views?.length === 0 && <AcLoader />}
      {gemma.all_views?.length > 0 && (
        <>
          <ReactSelect
            placeholder='Selecteer een view'
            className={clsx('ac-gemma-select')}
            onChange={(e) => setView(e.value)}
            loading={gemma.all_views?.length === 0}
            options={gemma.all_views?.map((view) => ({
              value: view.id,
              label: view.name,
            }))}
          />

          {gemma.get_view && (
            <div className='ac-gemma-view-header'>
              <h1>{gemma.get_view.name}</h1>
              <PrimaryActionButton
                disabled={!gemma.get_view || (gemma.get_view && !viewIsDoneLoading)}
                onClick={() => downloadSvg()}
              >
                <VISUALS.DOWNLOAD /> Download SVG
              </PrimaryActionButton>
            </div>
          )}

          {gemma.get_view && viewNodesData && viewRelationsData && (
            <div className='ac-gemma-graph-container' id='graph-container'></div>
          )}
          {!gemma.get_view &&
            !viewNodesData &&
            !viewRelationsData &&
            !viewIsDoneLoading && (
              <div className='ac-gemma-graph-container-loading' />
            )}
          {gemma.get_view && !viewIsDoneLoading && (
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

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AcContainer } from '@atoms';
import { withStore } from '@stores';
import { dia, shapes } from 'jointjs';
import { ViewRenderer, ViewSettings } from '@conduction/archimate-diagram-engine';
import { PrimaryActionButton } from '@utrecht/component-library-react/dist/css-module';
import { AcLoader } from '@components';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import svgPanZoom from 'svg-pan-zoom';
import { useParams } from 'react-router';

const AcViews = ({ store: { gemma } }) => {
  const { fetchView, resetView } = gemma;
  const [viewNodesData, setViewNodesData] = useState(null);
  const [viewRelationsData, setViewRelationsData] = useState(null);
  const [viewIsDoneLoading, setViewIsDoneLoading] = useState(false);

  const { id } = useParams();

  const getViewName = (view) => {
    if (!view) return 'Unnamed View';
    return (
      view.properties?.find(
        (property) => property.propertyDefinitionRef === 'propid-70'
      )?.value ||
      view.name ||
      view['@self']?.name ||
      'Unnamed View'
    );
  };

  useEffect(() => {
    setViewNodesData(null);
    setViewRelationsData(null);
    setViewIsDoneLoading(false);

    fetchView(id);
    return () => {
      resetView();
    };
  }, [id]);

  useEffect(() => {
    if (!gemma.get_view) return;

    // Handle both old and new API response structures.
    // The xml property contains the full AMEF data with viewNodes when top-level fields are empty.
    const xmlData = gemma.get_view.xml || {};
    const resolvedNodes = gemma.get_view.nodes || gemma.get_view.viewNodes || xmlData.viewNodes || xmlData.node || [];
    const resolvedConnections =
      gemma.get_view.connections || gemma.get_view.viewRelationships || xmlData.connection || [];

    // New API structure: xml.viewNodes already contains fully enriched node data
    // (name, type, position, color, font, elementRef, etc.) — no per-node API calls needed.
    if (Array.isArray(xmlData.viewNodes) && xmlData.viewNodes.length > 0) {
      const sanitizedNodes = xmlData.viewNodes.map((node) => ({
        ...node,
        viewNodeId: node.viewNodeId || node.id || node.identifier || node.modelNodeId || 'unknown',
        name: node.name || node.elementProperties?.name || 'unknown',
        type: (node.elementProperties?.type || node.type || 'dataobject').toLowerCase(),
        gemmaType: node.type || node.gemmaType || node.elementProperties?.gemmaType || null,
      }));
      setViewNodesData(sanitizedNodes);
      setViewRelationsData(resolvedConnections);
      return;
    }

    // Legacy path: nodes exist at top level but need per-node API enrichment
    if (resolvedNodes.length === 0 && resolvedConnections.length === 0) {
      console.warn('View data is missing nodes and connections:', gemma.get_view);
      return;
    }

    let legacyViewNodesData = [];
    const hostname = window.location.hostname;
    const baseUrl =
      hostname === 'vng.test.opencatalogi.nl'
        ? 'https://vng.test.commonground.nu/apps'
        : 'https://vng.accept.commonground.nu/apps';

    const getViewNodesData = () => {
      if (!Array.isArray(resolvedNodes) || resolvedNodes.length === 0) {
        console.warn('No nodes found in view data:', gemma.get_view);
        return Promise.resolve([]);
      }

      const promises = resolvedNodes.map(async (node) => {
        if (!node.elementRef) return null;

        try {
          const response = await fetch(
            `${baseUrl}/openregister/api/objects/vng-gemma/element?identifier=${node.elementRef}`
          );
          const data = await response.json();

          if (!data.results[0]) return null;

          return {
            name: data.results[0]?.name || 'unknown',
            id: node.elementRef,
            description: data.results[0]?.documentation || undefined,
            type: data.results[0]?.type || undefined,
          };
        } catch (error) {
          console.error(`Error fetching node data: ${error}`);
          return null;
        }
      });

      return Promise.all(promises).then((results) => {
        legacyViewNodesData.push(...results.filter(Boolean));
      });
    };

    const getChildNodesData = async (nodes = resolvedNodes) => {
      if (!nodes || !Array.isArray(nodes)) {
        console.warn('No nodes provided for child processing');
        return Promise.resolve([]);
      }

      const childPromises = nodes.reduce((promises, node) => {
        if (!node.nodes) return promises;

        const nodePromises = node.nodes.map(async (child) => {
          if (!child.elementRef) return null;

          try {
            const response = await fetch(
              `${baseUrl}/openregister/api/objects/vng-gemma/element?identifier=${child.elementRef}`
            );
            const data = await response.json();

            if (!data.results[0]) return null;

            const childNode = {
              name: data.results[0]?.name || 'unknown',
              id: child.elementRef,
              description: data.results[0]?.documentation || undefined,
              type: data.results[0]?.type || undefined,
              parent: node.elementRef,
            };

            legacyViewNodesData.push(childNode);

            // Recursively process child nodes if they exist
            if (child.nodes) {
              await getChildNodesData([child]);
            }

            return childNode;
          } catch (error) {
            console.error(`Error fetching child node data: ${error}`);
            return null;
          }
        });

        return [...promises, ...nodePromises];
      }, []);

      return Promise.all(childPromises);
    };

    getViewNodesData()
      .then(() => getChildNodesData())
      .then(() => {
        setViewNodesData(legacyViewNodesData);
      });

    const getViewRelationsData = () => {
      if (!Array.isArray(resolvedConnections) || resolvedConnections.length === 0) {
        setViewRelationsData([]);
        return Promise.resolve([]);
      }

      const relationshipPromises = resolvedConnections.map(
        async (relationship) => {
          if (!relationship.relationshipRef) return null;
          if (relationship.relationshipRef.includes('@attribute')) return null;

          try {
            const response = await fetch(
              `${baseUrl}/openregister/api/objects/vng-gemma/relationships?identifier=${relationship.relationshipRef}`
            );
            const data = await response.json();

            return {
              name:
                data.results[0]?.properties.find(
                  (item) => item.propertyDefinitionRef === 'propid-62'
                )?.value || undefined,
              id: relationship.relationshipRef,
              type: data.results[0]?.type || undefined,
            };
          } catch (error) {
            console.error(`Error fetching relationship data: ${error}`);
            return null;
          }
        }
      );

      return Promise.all(relationshipPromises).then((results) => {
        const validRelations = results.filter(Boolean);
        if (resolvedConnections.length > 0) {
          setViewRelationsData(validRelations);
        } else {
          setViewRelationsData([]);
        }
      });
    };

    getViewRelationsData();
  }, [gemma.get_view]);

  useEffect(() => {
    if (!gemma.get_view) return;
    if (!viewNodesData) return;
    if (!viewRelationsData) return;

    // Create container in HTML
    const container = document.getElementById('graph-container');

    // Initialize the graph
    let outputGraph = new dia.Graph({}, { cellNamespace: shapes });

    const paper = new dia.Paper({
      el: container,
      model: outputGraph,
      width: 1168,
      height: 800,
      gridSize: 1,
      interactive: {
        elementMove: false,
        addLinkFromMagnet: false,
        vertexAdd: false,
        vertexMove: false,
        labelMove: false,
        useLinkTools: false,
      },
      defaultInteractive: false,
    });

    // Freeze paper to suppress rendering during bulk cell addition.
    paper.freeze();

    // Add click handler to the paper
    paper.on('element:pointerclick', (elementView) => {
      const model = elementView.model;
      const onClick = model.prop('onClick');
      if (typeof onClick === 'function') {
        onClick();
      }
    });

    let viewNodes = [];
    let viewRelationships = [];

    // Detect whether viewNodesData comes from the new enriched API format
    // (nodes have x/y/width/height/color directly) or the legacy format
    // (nodes only have id/name/type from per-node API lookups).
    const isEnrichedFormat = viewNodesData.length > 0 && viewNodesData[0].x !== undefined;

    if (isEnrichedFormat) {
      // New API path: viewNodesData already contains fully enriched nodes with
      // position, color, font, parent hierarchy, etc.
      // Apply topological sort so parents render before children.
      const rawNodes = [...viewNodesData];
      const sorted = [];
      const placed = new Set();
      const remaining = [...rawNodes];
      let prevLength = -1;
      while (remaining.length > 0 && remaining.length !== prevLength) {
        prevLength = remaining.length;
        const toRemove = [];
        for (let i = 0; i < remaining.length; i++) {
          const n = remaining[i];
          if (!n.parent || placed.has(n.parent)) {
            sorted.push(n);
            placed.add(n.viewNodeId);
            toRemove.push(i);
          }
        }
        for (let j = toRemove.length - 1; j >= 0; j--) {
          remaining.splice(toRemove[j], 1);
        }
      }
      // Append any remaining nodes (e.g. orphans with missing parents)
      sorted.push(...remaining);

      // Convert absolute coordinates to parent-relative.
      const absPos = {};
      sorted.forEach((n) => {
        const parentAbs = n.parent ? absPos[n.parent] : null;
        absPos[n.viewNodeId] = { x: (n.x || 0), y: (n.y || 0) };
        if (parentAbs) {
          n.x = (n.x || 0) - parentAbs.x;
          n.y = (n.y || 0) - parentAbs.y;
        }
      });

      viewNodes = sorted;
      viewRelationships = (viewRelationsData || []).map((r) => ({
        modelRelationshipId: r.modelRelationshipId,
        sourceId: r.sourceId,
        targetId: r.targetId,
        viewRelationshipId: r.viewRelationshipId,
        type: (r.type || 'relationship').toLowerCase(),
        bendpoints: Array.isArray(r.bendpoints)
          ? r.bendpoints.map((b) => ({ x: parseFloat(b.x) || 0, y: parseFloat(b.y) || 0 }))
          : [],
        label: {},
      }));
    } else {
      // Legacy path: viewNodesData has basic info from per-node API lookups;
      // use gemma.get_view.nodes for position/style data.
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
          if (node.type === 'Label') {
            return {
              modelNodeId: node.identifier,
              viewNodeId: node.identifier || 'unknown',
              name: node.label,
              type: node.type?.toLowerCase() || getType(),
              x: node.position.x,
              y: node.position.y,
              width: node.position.w,
              height: node.position.h,
              parent: null,
              description: node.label,
              font: node.style.font,
              elementRef: null,
            };
          }
          if (!node.referentieComponenten) return;
          const nodes = node.referentieComponenten?.map((refComponent) => {
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
              elementRef: null,
            };
          });

          return nodes;
        } else {
          return {
            modelNodeId: node.isChildNode ? node.identifier : node.elementRef,
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
            elementRef: node.elementRef || null,
            onClick: () => {
              window.open(
                `https://www.gemmaonline.nl/wiki/GEMMA/${node.elementRef}`,
                '_blank'
              );
            },
          };
        }
      };

      const gemmaNodes = gemma.get_view.nodes || [];

      // Helper function to recursively collect all child nodes
      const getAllChildNodes = (nodes) => {
        return nodes.reduce((acc, node) => {
          if (!node.nodes) return acc;
          const children = node.nodes.map((child) => ({ ...child, isChildNode: true }));
          const grandchildren = getAllChildNodes(node.nodes);
          return [...acc, ...children, ...grandchildren];
        }, []);
      };

      const gemmaChildNodes = getAllChildNodes(gemma.get_view.nodes || []).filter(Boolean);
      const allNodes = [...gemmaNodes, ...gemmaChildNodes];

      viewNodes = allNodes
        .flatMap(convertToViewNode)
        .filter(Boolean)
        .filter((node) => node.type && node.name && node.viewNodeId);

      const convertToViewRelationship = (relationship) => {
        const relationshipData = viewRelationsData.find(
          (item) => item.id === relationship.relationshipRef
        );
        const bendpoints = relationship.bendpoints
          ? relationship.bendpoints.map((bendpoint) => ({
              x: parseFloat(bendpoint.x) || 0,
              y: parseFloat(bendpoint.y) || 0,
            }))
          : [];
        return {
          modelRelationshipId: relationship.relationshipRef,
          sourceId: relationship.source,
          targetId: relationship.target,
          viewRelationshipId: relationship.identifier,
          type: relationshipData?.type?.toLowerCase() || 'access',
          bendpoints: bendpoints,
          label: {
            text: relationshipData?.name || undefined,
            ...(relationshipData?.name && {
              markup: [
                {
                  style: {
                    fontSize: relationship.style?.font?.size,
                    fontFamily: relationship.style?.font?.name,
                    fontColor: relationship.style?.color
                      ? `rgba(${relationship.style.color.r}, ${relationship.style.color.g}, ${relationship.style.color.b}, ${relationship.style.color.a})`
                      : undefined,
                  },
                },
              ],
            }),
          },
        };
      };

      const viewRelationshipsArray =
        (gemma.get_view.connections || []).length > 0
          ? (gemma.get_view.connections || []).map((relationship, idx) =>
              convertToViewRelationship(relationship, idx)
            )
          : [];

      viewRelationships = viewRelationshipsArray.filter(
        (relationship) => relationship !== undefined
      );
    }

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

    // Unfreeze: triggers a single batch render of all cells at once.
    paper.unfreeze();

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
  };

  const setNodeColor = (node) => {
    const parentElement = document.querySelector(`[model-id="${node.viewNodeId}"]`);
    parentElement.setAttribute('data-tooltip-id', TOOLTIP_ID);
    node.description &&
      parentElement.setAttribute('data-tooltip-content', node.description);

    let allRectElements = parentElement.querySelectorAll(':scope > rect');
    allRectElements.forEach((item) => {
      node?.color && item.setAttribute('fill', node?.color);
      node?.borderColor && item.setAttribute('stroke', node?.borderColor);
    });

    let allPolygonElements = parentElement.querySelectorAll(':scope > polygon');
    allPolygonElements.forEach((item) => {
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

  // TODO: this just needs a code fix, panZoomInstance is not being used
  // eslint-disable-next-line no-unused-vars
  const [panZoomInstance, setPanZoomInstance] = useState(null);

  useEffect(() => {
    if (!gemma.get_view || !viewIsDoneLoading) return;

    const svg = document.getElementById('svg-container');
    if (!svg) return;

    let svgHovered = false;
    let touchStarted = false;
    let initialPinchDistance = null;
    let initialScale = null;
    let lastPinchCenter = null;

    const instance = svgPanZoom(svg, {
      zoomEnabled: true,
      controlIconsEnabled: true,
      fit: true,
      center: true,
      minZoom: 0.1,
      maxZoom: 10,
      zoomScaleSensitivity: 0.5,
      customEventsHandler: {
        haltEventListeners: [
          'touchstart',
          'touchend',
          'touchmove',
          'touchleave',
          'touchcancel',
        ],
        init: function (options) {
          function updateSvgClassName() {
            options.svgElement.setAttribute('class', svgHovered ? 'hovered' : '');
          }

          function getTouchCenter(touch1, touch2) {
            const rect = options.svgElement.getBoundingClientRect();
            return {
              x: (touch1.clientX + touch2.clientX) / 2 - rect.left,
              y: (touch1.clientY + touch2.clientY) / 2 - rect.top,
            };
          }

          function getRelativePoint(svgElement, x, y) {
            const ctm = svgElement.getScreenCTM();
            const point = svgElement.createSVGPoint();
            point.x = x;
            point.y = y;
            return point.matrixTransform(ctm.inverse());
          }

          this.listeners = {
            mouseenter: function () {
              svgHovered = true;
              options.instance.enableZoom();
              updateSvgClassName();
            },
            mouseleave: function () {
              svgHovered = false;
              updateSvgClassName();
            },
            touchstart: function (evt) {
              touchStarted = true;
              if (evt.touches.length === 2) {
                const touch1 = evt.touches[0];
                const touch2 = evt.touches[1];

                initialPinchDistance = Math.hypot(
                  touch2.clientX - touch1.clientX,
                  touch2.clientY - touch1.clientY
                );

                lastPinchCenter = getTouchCenter(touch1, touch2);
                initialScale = options.instance.getZoom();
              }
              evt.preventDefault();
            },
            touchmove: function (evt) {
              if (!touchStarted) return;

              evt.preventDefault();

              if (evt.touches.length === 2) {
                const touch1 = evt.touches[0];
                const touch2 = evt.touches[1];

                // Calculate new distance and center point
                const currentDistance = Math.hypot(
                  touch2.clientX - touch1.clientX,
                  touch2.clientY - touch1.clientY
                );

                const currentCenter = getTouchCenter(touch1, touch2);

                if (initialPinchDistance && initialScale && lastPinchCenter) {
                  // Calculate scale change
                  const scaleFactor = currentDistance / initialPinchDistance;
                  const newScale = Math.min(
                    Math.max(initialScale * scaleFactor, 0.1),
                    10
                  );

                  // Get the relative point in SVG coordinates
                  const svgPoint = getRelativePoint(
                    options.svgElement,
                    currentCenter.x,
                    currentCenter.y
                  );

                  // Calculate the zoom center point
                  const zoomPoint = {
                    x: svgPoint.x,
                    y: svgPoint.y,
                  };

                  // Apply zoom centered on the pinch point
                  options.instance.zoom(newScale, zoomPoint);

                  // Calculate and apply the pan adjustment
                  if (lastPinchCenter) {
                    const dx = currentCenter.x - lastPinchCenter.x;
                    const dy = currentCenter.y - lastPinchCenter.y;
                    options.instance.panBy({ x: dx, y: dy });
                  }

                  lastPinchCenter = currentCenter;
                }
              } else if (evt.touches.length === 1) {
                // Handle single touch pan
                const touch = evt.touches[0];
                const dx = touch.clientX - (this.lastX || touch.clientX);
                const dy = touch.clientY - (this.lastY || touch.clientY);

                options.instance.panBy({ x: dx, y: dy });

                this.lastX = touch.clientX;
                this.lastY = touch.clientY;
              }
            },
            touchend: function () {
              touchStarted = false;
              initialPinchDistance = null;
              initialScale = null;
              lastPinchCenter = null;
              delete this.lastX;
              delete this.lastY;
            },
            touchcancel: function () {
              touchStarted = false;
              initialPinchDistance = null;
              initialScale = null;
              lastPinchCenter = null;
              delete this.lastX;
              delete this.lastY;
            },
          };

          this.listeners.mousemove = this.listeners.mouseenter;

          // Add event listeners
          for (const eventName in this.listeners) {
            options.svgElement.addEventListener(
              eventName,
              this.listeners[eventName]
            );
          }
        },
        destroy: function (options) {
          for (const eventName in this.listeners) {
            options.svgElement.removeEventListener(
              eventName,
              this.listeners[eventName]
            );
          }
        },
      },
    });

    setPanZoomInstance(instance);

    return () => {
      if (instance) {
        instance.destroy();
      }
    };
  }, [gemma.get_view, viewIsDoneLoading]);

  //////////////////// End Scrolling ///////////////////////////

  const downloadSvg = () => {
    const svg = document.getElementById('svg-container');
    if (!svg) return;

    // Create a clone of the SVG to modify
    const clonedSvg = svg.cloneNode(true);

    // Remove the zoom controls from the cloned SVG
    const zoomControls = clonedSvg.querySelector('.svg-pan-zoom-control');
    if (zoomControls) {
      zoomControls.remove();
    }

    // Reset cursor style
    clonedSvg.style.cursor = 'default';

    // Convert React tooltips to native SVG tooltips
    const elementsWithTooltips = clonedSvg.querySelectorAll(
      '[data-tooltip-content]'
    );
    elementsWithTooltips.forEach((element) => {
      const tooltipContent = element.getAttribute('data-tooltip-content');
      if (tooltipContent) {
        // Remove React tooltip attributes
        element.removeAttribute('data-tooltip-id');
        element.removeAttribute('data-tooltip-content');

        // Create and add SVG title element
        const titleElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'title'
        );
        titleElement.textContent = tooltipContent;

        // Insert title as first child to ensure it appears on hover
        element.insertBefore(titleElement, element.firstChild);
      }
    });

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
      {!gemma.get_view && !gemma.get_viewError && <AcLoader />}

      {gemma.get_viewError && (
        <div className='ac-gemma-view-error'>
          <h1>View Not Found</h1>
          <p>
            The requested view could not be found or there was an error loading it.
          </p>
          <p>Please check the URL and try again.</p>
        </div>
      )}

      {gemma.get_view && !gemma.get_viewError && (
        <div className='ac-gemma-view-header'>
          <div>
            <h1 className='ac-gemma-view-header-title'>
              {getViewName(gemma.get_view)}
            </h1>
            <div>{gemma.get_view.documentation}</div>
          </div>

          <PrimaryActionButton
            className='ac-gemma-view-header-download-button'
            disabled={!gemma.get_view || (gemma.get_view && !viewIsDoneLoading)}
            onClick={() => downloadSvg()}
          >
            <VISUALS.DOWNLOAD /> Download SVG
          </PrimaryActionButton>
        </div>
      )}

      {gemma.get_view &&
        viewNodesData &&
        viewRelationsData &&
        !gemma.get_viewError && (
          <div className='ac-gemma-graph-container' id='graph-container'></div>
        )}
      {!gemma.get_view &&
        !viewNodesData &&
        !viewRelationsData &&
        !viewIsDoneLoading &&
        !gemma.get_viewError && <div className='ac-gemma-graph-container-loading' />}
      {gemma.get_view && !viewIsDoneLoading && !gemma.get_viewError && (
        <div className='ac-gemma-graph-container-loading'>
          <AcLoader className='ac-gemma-graph-container-loading-loader' />
        </div>
      )}
    </AcContainer>
  );
};

export default withStore(observer(AcViews));

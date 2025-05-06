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
import svgPanZoom from 'svg-pan-zoom';

const AcGemmaTest = ({ store: { gemma } }) => {
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

  const getViewName = (view) => {
    return (
      view.properties.find(
        (property) => property.propertyDefinitionRef === 'propid-70' //propid-70
      )?.value || view.name
    );
  };

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
    if (!gemma.get_view || !gemma.get_allVoorzieningGebruik) return;
    let viewNodesData = [];

    const hostname = window.location.hostname;
    const baseUrl =
      hostname === 'localhost' || hostname === 'vng.opencatalogi.nl'
        ? 'https://vng.test.commonground.nu/apps'
        : 'https://vng.accept.commonground.nu/apps';

    const getViewNodesData = () => {
      const nodes = gemma.get_view.nodes
        .map((node) => {
          if (!node.elementRef) return null;

          return {
            name: node.name,
            id: node.elementRef,
            description: node.documentation,
            type: node.elementType,
            properties: node.properties,
            parent: null,
          };
        })
        .filter(Boolean);

      viewNodesData.push(...nodes);
    };

    const getChildNodesData = (nodes = gemma.get_view.nodes) => {
      const childNodes = nodes.flatMap((node) => {
        if (!node.nodes) return [];

        return node.nodes
          .map((child) => {
            if (!child.elementRef) return null;

            const childNode = {
              name: child.name || 'unknown',
              id: child.elementRef,
              description: child.documentation || undefined,
              type: child.elementType || undefined,
              parent: node.elementRef,
              properties: child.properties || undefined,
            };

            viewNodesData.push(childNode);

            // Recursively process child nodes if they exist
            if (child.nodes) {
              getChildNodesData([child]);
            }

            return childNode;
          })
          .filter(Boolean);
      });

      return childNodes;
    };

    // Execute functions sequentially
    getViewNodesData();
    getChildNodesData();

    // Process voorziening nodes
    const parentChildrenCount = {};

    console.log(gemma.get_allVoorzieningGebruik);

    // First pass: count children per parent node
    gemma.get_allVoorzieningGebruik.forEach((voorziening) => {
      if (!voorziening?.referentieComponenten) return;

      voorziening.referentieComponenten.forEach((parentId) => {
        parentChildrenCount[parentId] = (parentChildrenCount[parentId] || 0) + 1;
      });
    });

    // Second pass: create and position child nodes
    gemma.get_allVoorzieningGebruik.forEach((voorziening) => {
      if (!voorziening?.referentieComponenten) return;

      voorziening.referentieComponenten.forEach((parentId) => {
        // Find the parent node in the view
        const parentNode = gemma.get_view.nodes.find(
          (node) => node.elementRef === parentId
        );

        if (!parentNode) return;

        // Calculate child node position
        const totalChildren = parentChildrenCount[parentId];
        const childIndex = viewNodesData.filter(
          (node) => node.parent === parentNode.identifier
        ).length;

        const PARENT_PADDING = 20;
        const CHILD_SPACING = 8;
        const parentWidth = parseInt(parentNode.position.w);
        const parentHeight = parseInt(parentNode.position.h);

        // Calculate dimensions
        const childWidth = Math.min(
          (parentWidth - PARENT_PADDING * 2 - CHILD_SPACING * (totalChildren - 1)) /
            totalChildren,
          120 // Max width cap
        );
        const childHeight = Math.min(parentHeight * 0.35, 30);

        // Calculate absolute position based on parent's position
        const absoluteX =
          parseInt(parentNode.position.x) +
          PARENT_PADDING +
          childIndex * (childWidth + CHILD_SPACING);
        // Position from bottom of parent instead of top
        const absoluteY =
          parseInt(parentNode.position.y) +
          parseInt(parentNode.position.h) - // Parent height
          childHeight - // Child height
          10; // 10px padding from bottom

        // Create child node
        viewNodesData.push({
          name: voorziening.opmerkingen || 'eDiensten',
          id: `${voorziening.id}_${parentId}`,
          viewNodeId: `${voorziening.id}_${parentId}`,
          type: 'dataobject',
          position: {
            x: absoluteX,
            y: absoluteY,
            w: childWidth,
            h: childHeight,
          },
          font: parentNode.style.font,
          parent: parentNode.identifier,
        });
      });
    });

    // Update state with the complete data
    setViewNodesData(viewNodesData);

    const getViewRelationsData = () => {
      const relationshipPromises = gemma.get_view.connections.map(
        async (relationship) => {
          if (!relationship.relationshipRef) return null;
          if (relationship.relationshipRef.includes('@attribute')) return null;

          try {
            const response = await fetch(
              `${baseUrl}/apps/openconnector/api/endpoint/relationships?identifier=${relationship.relationshipRef}`
            );
            const data = await response.json();

            return {
              name:
                data.properties.find(
                  (item) =>
                    item.propertyDefinitionRef === 'propid-61' ||
                    item.propertyDefinitionRef === 'propid-62'
                )?.value || undefined,
              id: relationship.relationshipRef,
              type: data.type || undefined,
            };
          } catch (error) {
            console.error(`Error fetching relationship data: ${error}`);
            return null;
          }
        }
      );

      return Promise.all(relationshipPromises).then((results) => {
        const validRelations = results.filter(Boolean);
        if (gemma.get_view.connections.length > 0) {
          setViewRelationsData(validRelations);
        } else {
          setViewRelationsData([]);
        }
      });
    };

    getViewRelationsData();
  }, [gemma.get_view, gemma.get_allVoorzieningGebruik]);

  useEffect(() => {
    if (!gemma.get_view || !gemma.get_allVoorzieningGebruik) return;
    if (!viewNodesData) return;
    if (!viewRelationsData) return;

    // Order nodes hierarchically
    const getOrderedNodes = () => {
      const orderedNodes = [];

      try {
        // Get all top-level nodes, including Labels and other types
        const topLevelNodes = gemma.get_view.nodes;

        // Helper function to recursively process nodes and their children
        const processNode = (node) => {
          // Add the current node (without isChildNode flag for root nodes)
          orderedNodes.push(node);

          if (node.nodes) {
            // Process each child node
            node.nodes.forEach((child) => {
              // Add child with isChildNode flag
              orderedNodes.push({
                ...child,
                isChildNode: true,
              });

              // Recursively process child's nodes if they exist
              if (child.nodes) {
                child.nodes.forEach((grandchild) => {
                  // Add grandchild with isChildNode flag
                  orderedNodes.push({
                    ...grandchild,
                    isChildNode: true,
                  });
                  // Continue recursion if needed
                  processNode(grandchild);
                });
              }
            });
          }
        };

        // Process all top-level nodes
        topLevelNodes.forEach(processNode);
      } catch (error) {
        console.error('Error ordering nodes:', error);
      }

      return orderedNodes;
    };

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

    // Add click handler to the paper
    paper.on('element:pointerclick', (elementView, evt) => {
      const model = elementView.model;
      const onClick = model.prop('onClick');
      if (typeof onClick === 'function') {
        onClick();
      }
    });

    // Helper function to recursively collect all child nodes
    const getAllChildNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        if (!node.nodes) return acc;

        // Add immediate child nodes
        const children = node.nodes.map((child) => ({
          ...child,
          isChildNode: true,
        }));

        // Recursively get children of children
        const grandchildren = getAllChildNodes(node.nodes);

        return [...acc, ...children, ...grandchildren];
      }, []);
    };

    const convertToViewNode = (node) => {
      // Create a memoized map of viewNodesData for faster lookups
      const nodeDataMap = new Map(viewNodesData.map((item) => [item.id, item]));
      const nodeDataNode = node.elementRef ? nodeDataMap.get(node.elementRef) : null;

      // Helper function to create style object - reduces repeated code
      const createStyleObject = (style) => ({
        color: style?.color?.a
          ? `rgba(${style?.color?.r}, ${style?.color?.g}, ${style?.color?.b}, ${style?.color?.a})`
          : `rgb(${style?.color?.r}, ${style?.color?.g}, ${style?.color?.b})`,
        fillColor: style?.fillColor?.a
          ? `rgba(${style?.fillColor?.r}, ${style?.fillColor?.g}, ${style?.fillColor?.b}, ${style?.fillColor?.a})`
          : `rgb(${style?.fillColor?.r}, ${style?.fillColor?.g}, ${style?.fillColor?.b})`,
        lineColor: style?.lineColor?.a
          ? `rgba(${style?.lineColor?.r}, ${style?.lineColor?.g}, ${style?.lineColor?.b}, ${style?.lineColor?.a})`
          : `rgb(${style?.lineColor?.r}, ${style?.lineColor?.g}, ${style?.lineColor?.b})`,
        font: {
          name: style?.font?.name,
          size: style?.font?.size,
          style: style?.font?.style,
        },
      });

      // Base node properties
      const baseNode = {
        modelNodeId: node.isChildNode
          ? node.identifier
          : node.elementRef || node.identifier,
        viewNodeId: node.identifier || 'unknown',
        x: node.position?.x,
        y: node.position?.y,
        width: node.position?.w,
        height: node.position?.h,
        parent: null,
      };

      // Handle special node types
      if (!node.elementRef) {
        if (['Label', 'Container'].includes(node.type)) {
          const style = createStyleObject(node.style);
          return {
            ...baseNode,
            name: node.label ?? ' ',
            type: node.type?.toLowerCase(),
            color: style.fillColor,
            borderColor: style.lineColor,
            description: node.label,
            font: { ...style.font, color: style.color },
            elementRef: null,
          };
        }

        if (node.referentieComponenten) {
          return node.referentieComponenten
            .map((refComponent) => {
              const uniqueId = `${node.id}_${refComponent}`;
              const nodeData = nodeDataMap.get(uniqueId);
              if (!nodeData) return null;

              const style = createStyleObject(node.style);
              return {
                ...baseNode,
                modelNodeId: nodeData.id,
                viewNodeId: nodeData.viewNodeId || 'unknown',
                name: nodeData.name || 'unknown',
                type: nodeData.type?.toLowerCase() || 'dataobject',
                x: nodeData.position?.x || 0,
                y: nodeData.position?.y || 0,
                width: nodeData.position?.w || 0,
                height: nodeData.position?.h || 0,
                font: { ...style.font, color: style.color },
                description: nodeData.description || null,
                elementRef: null,
              };
            })
            .filter(Boolean);
        }

        // Handle regular nodes without elementRef
        const style = createStyleObject(node.style);
        return {
          ...baseNode,
          name: node.label,
          type: node.type?.toLowerCase() || 'dataobject',
          color: style.fillColor,
          borderColor: style.lineColor,
          font: { ...style.font, color: style.color },
          description: node.label,
          elementRef: null,
        };
      }

      // Handle nodes with elementRef
      const style = createStyleObject(node.style);
      return {
        ...baseNode,
        name: nodeDataNode?.name || 'unknown',
        type: nodeDataNode?.type?.toLowerCase() || 'dataobject',
        color: style.fillColor,
        borderColor: style.lineColor,
        font: { ...style.font, color: style.color },
        description: nodeDataNode?.description || null,
        elementRef: node.elementRef || null,
        onClick: () => {
          const propertyId = nodeDataNode?.properties?.find(
            (item) => item.propertyDefinitionRef === 'propid-2'
          )?.value;
          const url = `https://www.gemmaonline.nl/wiki/GEMMA/${
            propertyId ? `id-${propertyId}` : node.elementRef
          }`;
          window.open(url, '_blank');
        },
      };
    };

    // Get ordered nodes and process them
    const orderedNodes = getOrderedNodes();
    const gemmaNodes = orderedNodes;
    const voorzieningNodes = gemma.get_allVoorzieningGebruik;

    const allNodes = [...gemmaNodes, ...voorzieningNodes];

    const viewNodes = allNodes
      .flatMap(convertToViewNode)
      .filter(Boolean)
      .filter((node) => node.type && node.name && node.viewNodeId);

    const convertToViewRelationship = (relationship, idx) => {
      const relationshipData = viewRelationsData.find(
        (item) => item.id === relationship.relationshipRef
      );

      // Convert bendpoint to array with numeric coordinates or return empty array
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
                  fontSize: relationship?.style?.font?.size,
                  fontFamily: relationship?.style?.font?.name,
                  fontColor: relationship?.style?.color?.a
                    ? `rgba(${relationship?.style?.color?.r}, ${relationship?.style?.color?.g}, ${relationship?.style?.color?.b}, ${relationship?.style?.color?.a})`
                    : `rgb(${relationship?.style?.color?.r}, ${relationship?.style?.color?.g}, ${relationship?.style?.color?.b})`,
                  fontStyle: relationship?.style?.font?.style,
                  fontWeight: relationship?.style?.font?.style,
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

    viewRelationships.forEach((relationship) => {
      setRelationshipColor(relationship);
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
    if (node.type?.toLowerCase() !== 'label') {
      parentElement.setAttribute('data-tooltip-id', TOOLTIP_ID);
      node.description &&
        parentElement.setAttribute('data-tooltip-content', node.description);
    }

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
      node?.font?.style && item.setAttribute('font-style', node?.font?.style);
      node?.font?.style === 'bold' && item.setAttribute('font-weight', 'bold');

      // Only apply left alignment for nodes with type 'label'
      if (node.type?.toLowerCase() === 'label') {
        // Get the current transform values
        const currentTransform = item.getAttribute('transform');
        if (currentTransform && currentTransform.includes('matrix')) {
          // Extract the existing translation values
          const matrix = currentTransform.match(
            /matrix\(1,0,0,1,(\d+\.?\d*),(\d+\.?\d*)\)/
          );
          if (matrix) {
            // Add left padding of 10px from the parent's left edge
            const leftPadding = 10;
            // Update transform to position text at the left with padding
            item.setAttribute(
              'transform',
              `matrix(1,0,0,1,${leftPadding},${matrix[2]})`
            );
          }
        }

        // Set text-anchor to start for left alignment
        item.setAttribute('text-anchor', 'start');

        // Reset x position of tspans
        const tspans = item.querySelectorAll('tspan');
        tspans.forEach((tspan) => {
          tspan.setAttribute('x', '0');
        });
      }
    });
  };

  const setRelationshipColor = (relationship) => {
    const parentElement = document.querySelector(
      `[model-id="${relationship.viewRelationshipId}"]`
    );

    let allPathElements = parentElement.querySelectorAll(':scope > path');
    allPathElements.forEach((item) => {
      item.setAttribute('cursor', 'drag');
    });

    let allTextElements = parentElement.querySelectorAll(':scope text');
    allTextElements.forEach((item) => {
      relationship?.label?.markup?.[0]?.style?.fontFamily &&
        item.style.setProperty(
          'font-family',
          relationship?.label?.markup?.[0]?.style?.fontFamily
        );
      if (relationship?.label?.markup?.[0]?.style?.fontSize) {
        // Ensure font size has a unit for Firefox
        const fontSize = relationship.label.markup[0].style.fontSize;
        const fontSizeWithUnit = fontSize.toString().match(/\d+$/)
          ? `${fontSize}px`
          : fontSize;
        item.style.setProperty('font-size', fontSizeWithUnit);
      }
      relationship?.label?.markup?.[0]?.style?.fontColor &&
        item.style.setProperty(
          'fill',
          relationship?.label?.markup?.[0]?.style?.fontColor
        );
      relationship?.label?.markup?.[0]?.style?.fontStyle &&
        item.style.setProperty(
          'font-style',
          relationship?.label?.markup?.[0]?.style?.fontStyle
        );
      relationship?.label?.markup?.[0]?.style?.fontWeight === 'bold' &&
        item.style.setProperty('font-weight', 'bold');
    });
  };

  //////////////////// Scrolling ///////////////////////////

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
              label: getViewName(view),
            }))}
          />

          {gemma.get_view && (
            <div className='ac-gemma-view-header'>
              <div className='ac-gemma-view-header-title-container'>
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
      {/* <div className='ac-gemma-graph-container' id='graph-container'></div> */}
    </AcContainer>
  );
};

export default withStore(observer(AcGemmaTest));

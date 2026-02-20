import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AcContainer } from '@atoms';
import { AcCheckbox } from '@molecules';
import { withStore } from '@stores';
import { dia, shapes } from 'jointjs';
// import { ViewRenderer, ViewSettings } from '@arktect-co/archimate-diagram-engine';
import { ViewRenderer, ViewSettings } from '@conduction/archimate-diagram-engine';
import { PrimaryActionButton } from '@utrecht/component-library-react/dist/css-module';
import { AcLoader } from '@components';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import ReactSelect from 'react-select';
import clsx from 'clsx';
import svgPanZoom from 'svg-pan-zoom';
// import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

const AcGemmaView = ({ store, viewId }) => {
  const { gemma } = store;
  const { fetchViews, resetViews, fetchView, resetView } = gemma;
  const [view, setView] = useState(null);
  const [viewNodesData, setViewNodesData] = useState(null);
  const [viewRelationsData, setViewRelationsData] = useState(null);
  const [viewIsDoneLoading, setViewIsDoneLoading] = useState(false);
  const [gebruikData, setGebruikData] = useState(null);
  const [moduleNames, setModuleNames] = useState({});
  const [filters, setFilters] = useState({ gebruik: false, product: false, deelnames: false });

  useEffect(() => {
    // Property definitions are not needed for the new API; directly load views when no viewId is provided
    if (!viewId) {
      fetchViews({ _limit: 100 });
    }
    setViewNodesData(null);
    setViewRelationsData(null);
    setViewIsDoneLoading(false);

    return () => resetViews();
  }, []);

  // If a viewId is provided, use it to set the view
  useEffect(() => {
    if (viewId) {
      setView(viewId);
    }
  }, [viewId]);

  useEffect(() => {
    if (!view) return;

    setViewNodesData(null);
    setViewRelationsData(null);
    setViewIsDoneLoading(false);

    const params = {
      ...(filters.gebruik ? { gebruik: true } : {}),
      ...(filters.product ? { product: true } : {}),
      ...(filters.deelnames ? { deelnames: true } : {}),
    };
    fetchView(view, params);
    return () => {
      resetView();
    };
  }, [view, filters]);

  // console.log({ gemma: gemma.get_view });

  useEffect(() => {
    if (!gemma.get_view) return;
    // New view object may not contain nodes/relationships; render empty graph in that case
    if (Array.isArray(gemma.get_view.viewNodes)) {
      // Sanitize nodes to ensure minimal required fields
      const sanitizedNodes = (gemma.get_view.viewNodes || []).map((node) => ({
        ...node,
        viewNodeId:
          node.viewNodeId ||
          node.id ||
          node.identifier ||
          node.modelNodeId ||
          'unknown',
        name: node.name || node.elementProperties?.name || 'unknown',
        type: (
          node.elementProperties?.type ||
          node.type ||
          'dataobject'
        ).toLowerCase(),
        gemmaType: node.type || node.gemmaType || node.elementProperties?.gemmaType || null,
      }));
      setViewNodesData(sanitizedNodes);
      setViewRelationsData(gemma.get_view.viewRelationships || []);
      setViewIsDoneLoading(true);
      return;
    }
    /* Legacy fallback retained for reference
    if (
      !Array.isArray(gemma.get_view.nodes) ||
      !Array.isArray(gemma.get_view.connections)
    ) {
      setViewNodesData([]);
      setViewRelationsData([]);
      setViewIsDoneLoading(true);
      return;
    }
    let viewNodesData = [];

    const getViewNodesData = () => {
      const nodes = gemma.get_view.nodes
        .map((node) => {
          if (!node.elementRef) return null;

          const nodeData = node.element;

          return {
            name: nodeData?.name || node.name,
            id: nodeData?.identifier || node.elementRef,
            description: nodeData?.documentation || node.documentation,
            type: nodeData?.type || 'dataobject',
            properties: nodeData?.properties || node.properties,
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

            const childData = child.element;

            const childNode = {
              name: childData?.name || 'unknown',
              id: childData?.identifier || child.elementRef,
              description: childData?.documentation || child.documentation,
              type: childData?.type || 'dataobject',
              parent: node.elementRef,
              properties: childData?.properties || child.properties,
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

    // Update state with the complete data
    setViewNodesData(viewNodesData);

    const getViewRelationsData = () => {
      const relationshipPromises = gemma.get_view.connections.map(
        async (relationship) => {
          if (!relationship.relationshipRef) return null;
          if (relationship.relationshipRef.includes('@attribute')) return null;

          const relationshipData = relationship.relationship;

          const propertyDefinitionRef = propertyDefinitions.find(
            (property) => property.name === 'Verbindingsrol'
          )?.identifier;

          return {
            name:
              relationshipData?.properties?.find(
                (item) => item.propertyDefinitionRef === propertyDefinitionRef
              )?.value || undefined,
            id: relationshipData?.identifier || relationship.relationshipRef,
            type: relationshipData?.type || undefined,
          };
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
    */
  }, [gemma.get_view]);

  // Load gebruik and module data when filters are active.
  // Uses pre-fetched data from the store when available,
  // falling back to fetching if the user navigated directly to the view.
  useEffect(() => {
    if (!filters.gebruik && !filters.deelnames) {
      setGebruikData(null);
      setModuleNames({});
      return;
    }

    const activeOrgUuid = store?.user?.activeOrganization?.uuid;

    const loadData = async () => {
      // Use store data if already pre-fetched, otherwise fetch now
      let gebruikResults = gemma.get_allVoorzieningGebruik;
      if (!gebruikResults) {
        const gebruikParams = {
          _limit: 10000,
          _fields: 'id,module,gebruiktVoorReferentiecomponenten,deelnemers,afnemer,@self',
        };
        if (activeOrgUuid) {
          gebruikParams.afnemer = activeOrgUuid;
        }
        await gemma.fetchGebruik(gebruikParams);
        gebruikResults = gemma.get_allVoorzieningGebruik || [];
      }

      let modulesData = gemma.get_modules;
      if (!modulesData) {
        modulesData = await gemma.fetchModules({ _limit: 10000, _fields: 'id,naam' });
      }

      // Build module name lookup
      const nameLookup = {};
      if (Array.isArray(modulesData)) {
        modulesData.forEach((m) => {
          if (m.id && m.naam) nameLookup[m.id] = m.naam;
          if (m.id && m['@self']?.name) nameLookup[m.id] = nameLookup[m.id] || m['@self'].name;
        });
      }
      setModuleNames(nameLookup);
      setGebruikData(gebruikResults);
    };

    loadData();
  }, [filters.gebruik, filters.deelnames]);

  useEffect(() => {
    if (!gemma.get_view) return;
    // Wait until we at least have empty arrays; allow rendering with empty data
    if (viewNodesData === null || viewRelationsData === null) return;

    // Legacy hierarchical ordering no longer used with new API; kept for reference.
    /*
    const getOrderedNodes = () => {
      const orderedNodes = [];

      try {
        const topLevelNodes = Array.isArray(gemma.get_view.nodes)
          ? gemma.get_view.nodes
          : [];

        const processNode = (node) => {
          orderedNodes.push(node);

          if (node.nodes) {
            node.nodes.forEach((child) => {
              orderedNodes.push({
                ...child,
                isChildNode: true,
              });

              if (child.nodes) {
                child.nodes.forEach((grandchild) => {
                  orderedNodes.push({
                    ...grandchild,
                    isChildNode: true,
                  });
                  processNode(grandchild);
                });
              }
            });
          }
        };

        topLevelNodes.forEach(processNode);
      } catch (error) {
        console.error('Error ordering nodes:', error);
      }

      return orderedNodes;
    };
    */

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

    // Legacy convertToViewNode retained for reference; not used with new API.
    /*
    const convertToViewNode = (node) => {
      const nodeDataMap = new Map(viewNodesData.map((item) => [item.id, item]));
      const nodeDataNode = node.elementRef ? nodeDataMap.get(node.elementRef) : null;

      const createStyleObject = (style) => ({
        color: style?.color?.a
          ? `rgba(${style?.color?.r ?? 0}, ${style?.color?.g ?? 0}, ${style?.color?.b ?? 0}, ${style?.color?.a ?? 1})`
          : `rgb(${style?.color?.r ?? 0}, ${style?.color?.g ?? 0}, ${style?.color?.b ?? 0})`,
        fillColor: style?.fillColor?.a
          ? `rgba(${style?.fillColor?.r ?? 0}, ${style?.fillColor?.g ?? 0}, ${style?.fillColor?.b ?? 0}, ${style?.fillColor?.a ?? 1})`
          : `rgb(${style?.fillColor?.r ?? 0}, ${style?.fillColor?.g ?? 0}, ${style?.fillColor?.b ?? 0})`,
        lineColor: style?.lineColor?.a
          ? `rgba(${style?.lineColor?.r ?? 0}, ${style?.lineColor?.g ?? 0}, ${style?.lineColor?.b ?? 0}, ${style?.lineColor?.a ?? 1})`
          : `rgb(${style?.lineColor?.r ?? 0}, ${style?.lineColor?.g ?? 0}, ${style?.lineColor?.b ?? 0})`,
        font: { name: style?.font?.name ?? 'Arial', size: style?.font?.size ?? 12, style: style?.font?.style ?? 'normal' },
      });

      const baseNode = {
        modelNodeId: node.isChildNode ? node.identifier : node.elementRef || node.identifier,
        viewNodeId: node.identifier || 'unknown',
        x: node.position?.x,
        y: node.position?.y,
        width: node.position?.w,
        height: node.position?.h,
        parent: null,
      };

      if (!node.elementRef) {
        if (['Label', 'Container'].includes(node.type)) {
          const style = createStyleObject(node.style);
          return { ...baseNode, name: node.label ?? ' ', type: node.type?.toLowerCase(), color: style.fillColor, borderColor: style.lineColor, description: node.label, font: { ...style.font, color: style.color }, elementRef: null };
        }

        if (node.voorzieningId.referentieComponenten) {
          return node.voorzieningId.referentieComponenten
            .map((refComponent) => {
              const uniqueId = `${node.voorzieningId.id}_${refComponent}`;
              const nodeData = nodeDataMap.get(uniqueId);
              if (!nodeData) return null;
              const style = createStyleObject(node.style);
              return { ...baseNode, modelNodeId: nodeData.id, viewNodeId: nodeData.viewNodeId || 'unknown', name: nodeData.name || 'unknown', type: nodeData.type?.toLowerCase() || 'dataobject', x: nodeData.position?.x || 0, y: nodeData.position?.y || 0, width: nodeData.position?.w || 0, height: nodeData.position?.h || 0, font: { ...style.font, color: style.color }, description: nodeData.description || null, elementRef: null };
            })
            .filter(Boolean);
        }

        const style = createStyleObject(node.style);
        return { ...baseNode, name: node.label, type: node.type?.toLowerCase() || 'dataobject', color: style.fillColor, borderColor: style.lineColor, font: { ...style.font, color: style.color }, description: node.label, elementRef: null };
      }

      const style = createStyleObject(node.style);
      return { ...baseNode, name: nodeDataNode?.name || 'unknown', type: nodeDataNode?.type?.toLowerCase() || 'dataobject', color: style.fillColor, borderColor: style.lineColor, font: { ...style.font, color: style.color }, description: nodeDataNode?.description || null, elementRef: node.elementRef || null, onClick: () => {
        const propertyId = nodeDataNode?.properties?.find((item) => item.propertyDefinitionRef === 'propid-2')?.value;
        const url = `https://www.gemmaonline.nl/wiki/GEMMA/${propertyId ? `id-${propertyId}` : node.elementRef}`;
        window.open(url, '_blank');
      } };
    };
    */

    let viewNodes = [];
    let viewRelationships = [];

    if (Array.isArray(gemma.get_view.viewNodes)) {
      // Topological sort: parents must be rendered before children so the
      // diagram engine can look up parent cells via graph.getCell(parentId).
      // Backend now stores nodes in correct order, but we keep this as a
      // safety net for data imported before the fix.
      const rawNodes = [...(viewNodesData || [])];

      // Merge gebruik overlay nodes when filters are active
      if (gebruikData && gebruikData.length > 0 && (filters.gebruik || filters.deelnames)) {
        // Build lookup: modelNodeId (with id- prefix) -> viewNode
        const viewNodeByModelId = {};
        rawNodes.forEach((n) => {
          if (n.modelNodeId) viewNodeByModelId[n.modelNodeId] = n;
        });

        // Track overlay count per parent for vertical stacking
        const overlayCountPerParent = {};
        let totalOverlays = 0;
        const MAX_OVERLAYS = 2000;

        gebruikData.forEach((gebruik) => {
          if (totalOverlays >= MAX_OVERLAYS) return;
          const refComps = gebruik.gebruiktVoorReferentiecomponenten;
          if (!Array.isArray(refComps) || refComps.length === 0) return;

          const isDeelname = false;
          const moduleName = moduleNames[gebruik.module] || 'Module';

          refComps.forEach((refCompUuid) => {
            const modelNodeId = `id-${refCompUuid}`;
            const parentNode = viewNodeByModelId[modelNodeId];
            if (!parentNode) return;

            const parentId = parentNode.viewNodeId;
            if (!overlayCountPerParent[parentId]) overlayCountPerParent[parentId] = 0;
            const stackIndex = overlayCountPerParent[parentId]++;

            const overlayHeight = 18;
            const overlayGap = 2;
            const overlayY = (parentNode.height || 80) - 5 - ((stackIndex + 1) * (overlayHeight + overlayGap));

            rawNodes.push({
              viewNodeId: `overlay-${gebruik.id}-${refCompUuid}`,
              modelNodeId: gebruik.module || gebruik.id,
              name: moduleName,
              type: 'applicationcomponent',
              gemmaType: 'ApplicationComponent',
              parent: parentId,
              x: 5,
              y: Math.max(20, overlayY),
              width: (parentNode.width || 120) - 10,
              height: overlayHeight,
              color: isDeelname ? 'rgb(180, 230, 255)' : 'rgb(200, 255, 200)',
              borderColor: isDeelname ? 'rgba(0, 100, 180, 0.6)' : 'rgba(0, 150, 0, 0.6)',
              font: { name: 'Segoe UI', size: 9, color: 'rgb(0, 0, 0)', style: 'normal' },
              _isModuleOverlay: true,
              _gebruikId: gebruik.id,
              _isDeelname: isDeelname,
            });
          });
        });
      }

      const sorted = [];
      const placed = new Set();
      const remaining = [...rawNodes];
      let prevLength = -1;
      while (remaining.length > 0 && remaining.length !== prevLength) {
        prevLength = remaining.length;
        // Forward iteration preserves original source order among siblings,
        // which is critical for correct SVG z-ordering (background rects
        // must render before the text labels they sit behind).
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
      // ArchiMate Open Exchange XML stores absolute positions, but the
      // diagram engine positions children relative to their parent.
      const absPos = {};
      sorted.forEach((n) => {
        const parentAbs = n.parent ? absPos[n.parent] : null;
        absPos[n.viewNodeId] = {
          x: (n.x || 0),
          y: (n.y || 0),
        };
        // Skip overlay nodes — their coordinates are already parent-relative.
        if (parentAbs && !n._isModuleOverlay) {
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
          ? r.bendpoints.map((b) => ({
              x: parseFloat(b.x) || 0,
              y: parseFloat(b.y) || 0,
            }))
          : [],
        label: {},
      }));
    }
    // Legacy shape derivation kept for reference.
    /*
    } else {
      const orderedNodes = getOrderedNodes();
      const gemmaNodes = orderedNodes;
      const allNodes = [...gemmaNodes];

      viewNodes = allNodes
        .flatMap(convertToViewNode)
        .filter(Boolean)
        .filter((node) => node.type && node.name && node.viewNodeId);

      const convertToViewRelationship = (relationship) => {
        const relationshipData = viewRelationsData.find((item) => item.id === relationship.relationshipRef);
        const bendpoints = relationship.bendpoints ? relationship.bendpoints.map((bendpoint) => ({ x: parseFloat(bendpoint.x) || 0, y: parseFloat(bendpoint.y) || 0 })) : [];
        return {
          modelRelationshipId: relationship.relationshipRef,
          sourceId: relationship.source,
          targetId: relationship.target,
          viewRelationshipId: relationship.identifier,
          type: relationshipData?.type?.toLowerCase() || 'access',
          bendpoints: bendpoints,
          label: { text: relationshipData?.name || undefined },
        };
      };

      const viewRelationshipsArray = gemma.get_view.connections.length > 0 ? gemma.get_view.connections.map((relationship) => convertToViewRelationship(relationship)) : [];
      viewRelationships = viewRelationshipsArray.filter((relationship) => relationship !== undefined);
    }
    */

    // Example nodes removed

    // Example relationships removed

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

    viewRelationships.forEach((relationship) => {
      setRelationshipColor(relationship);
    });

    container.querySelectorAll(':scope > svg').forEach((node) => {
      setSvgViewBox(node);
    });

    viewNodes && viewRelationships && setViewIsDoneLoading(true);
  }, [viewNodesData, viewRelationsData, gebruikData, moduleNames, filters.gebruik, filters.deelnames]);

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
    // Only initialize when view is fully loaded and rendered
    if (
      !gemma.get_view ||
      !viewIsDoneLoading ||
      !viewNodesData ||
      !viewRelationsData
    )
      return;

    // Add a small delay to ensure DOM is fully updated
    const initTimer = setTimeout(() => {
      const svg = document.getElementById('svg-container');
      if (!svg) return;

      // Clean up existing instance and controls
      try {
        if (panZoomInstance && typeof panZoomInstance.destroy === 'function') {
          panZoomInstance.destroy();
        }
        const existingControls = svg.querySelector('.svg-pan-zoom-control');
        if (existingControls) {
          existingControls.remove();
        }
      } catch (error) {
        console.warn('Error cleaning up pan-zoom instance:', error);
      }

      // Reset transformations
      const existingGroup = svg.querySelector('g');
      if (existingGroup) {
        existingGroup.setAttribute('transform', 'translate(0,0) scale(1)');
      }

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
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(initTimer);
      try {
        if (panZoomInstance && typeof panZoomInstance.destroy === 'function') {
          panZoomInstance.destroy();
        }
      } catch (error) {
        console.warn('Error cleaning up pan-zoom instance:', error);
      }
      setPanZoomInstance(null);
    };
  }, [gemma.get_view, viewIsDoneLoading, viewNodesData, viewRelationsData]); // Add viewNodesData and viewRelationsData as dependencies

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
  if (viewId) {
    return (
      <AcContainer spacing='lg'>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <AcCheckbox
            label='Gebruik'
            checked={filters.gebruik}
            onChange={(checked) => setFilters((f) => ({ ...f, gebruik: checked }))}
          />
          <AcCheckbox
            label='Product'
            checked={filters.product}
            onChange={(checked) => setFilters((f) => ({ ...f, product: checked }))}
          />
          <AcCheckbox
            label='Deelnames'
            checked={filters.deelnames}
            onChange={(checked) => setFilters((f) => ({ ...f, deelnames: checked }))}
          />
        </div>
        {gemma.get_view && !viewIsDoneLoading && (
          <div className='ac-gemma-graph-container-loading'>
            <AcLoader className='ac-gemma-graph-container-loading-loader' />
          </div>
        )}
        <div className='ac-gemma-graph-container' id='graph-container'></div>
      </AcContainer>
    );
  }

  return (
    <AcContainer spacing='lg'>
      {!gemma.all_views || gemma.all_views?.length === 0 ? (
        <AcLoader />
      ) : (
        <>
          <ReactSelect
            placeholder='Selecteer een view'
            className={clsx('ac-gemma-select')}
            onChange={(e) => setView(e.value)}
            loading={!gemma.all_views || gemma.all_views.length === 0}
            options={gemma.all_views.map((v) => ({ value: v.id, label: v.name }))}
          />

          {gemma.get_view && (
            <div className='ac-gemma-view-header'>
              <div className='ac-gemma-view-header-title-container'>
                {/* New view object provides 'name' and 'description' fields */}
                <h1 className='ac-gemma-view-header-title'>{gemma.get_view.name}</h1>
                <div>{gemma.get_view.description}</div>
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

          {/* Only render graph when new view object contains detailed nodes/relationships */}
          {Array.isArray(gemma.get_view?.viewNodes) &&
            Array.isArray(gemma.get_view?.viewRelationships) &&
            viewNodesData &&
            viewRelationsData && (
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

export default withStore(observer(AcGemmaView));

import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useLocation } from 'react-router';
import { AcFlex, AcSection } from '@atoms';
import { withStore } from '@stores';
// import { PrimaryActionButton } from '@utrecht/component-library-react/dist/css-module';
import { AcLoader, ConDynamicSidenav } from '@components';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import { dia, shapes } from 'jointjs';
import { ViewRenderer, ViewSettings } from '@conduction/archimate-diagram-engine';
import svgPanZoom from 'svg-pan-zoom';
import { AcCheckbox } from '@molecules';
import ConActionMenu from '@views/ac-beheer/shared/components/con-action-menu';

/**
 * Beheer Views Component
 * Admin interface for viewing and managing AMEF views
 */
const ConBeheerViews = ({ store }) => {
  const { gemma } = store || {};
  const location = useLocation();
  const params = useParams();

  // State management
  const [viewNodesData, setViewNodesData] = useState(null);
  const [viewRelationsData, setViewRelationsData] = useState(null);
  const [viewIsDoneLoading, setViewIsDoneLoading] = useState(false);
  const [panZoomInstance, setPanZoomInstance] = useState(null);
  // Combined overlay data — single state object prevents cascading renders
  // when multiple data sources load in an async context.
  const [overlayData, setOverlayData] = useState({
    gebruik: null,
    applicaties: null,
    deelnames: null,
    moduleNames: {},
  });
  const [filters, setFilters] = useState({
    gebruik: false,
    applicaties: false,
    deelnames: false,
  });
  const [frozenViewHtml, setFrozenViewHtml] = useState(null);
  const [isFilterTransition, setIsFilterTransition] = useState(false);

  // Refs for persistent graph state (survive across filter toggles)
  const graphRef = useRef(null);
  const paperRef = useRef(null);
  const overlayIdsRef = useRef([]);

  // Sync filters from URL
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const gebruik = sp.get('gebruik') === 'true';
    const applicaties = sp.get('applicaties') === 'true';
    const deelnames = sp.get('deelnames') === 'true';
    setFilters({ gebruik, applicaties, deelnames });
  }, [location.search]);

  // Load view by route param when present.
  // Filters do NOT affect the view data itself (overlay data is loaded separately),
  // so we only re-fetch when the view ID changes.
  useEffect(() => {
    if (!gemma) return;
    if (!params?.id) return;
    setViewIsDoneLoading(false);
    gemma.fetchView(params.id);
  }, [gemma, params?.id]);

  // Helper function to get view name
  const getViewName = (view) => {
    const inlineTitle =
      typeof view?.titelViewSwc === 'string' ? view.titelViewSwc.trim() : '';
    if (inlineTitle) return inlineTitle;
    return view?.name || view['@self'].name || 'Unnamed View';
  };

  // Update URL when filters change (keep existing params)
  const handleToggleFilter = (key) => (checked) => {
    // Only capture frozen view when turning a filter ON (data may need loading).
    // Filter OFF is near-instant with incremental overlay removal.
    if (checked) {
      const container = document.getElementById('graph-container');
      if (container && viewIsDoneLoading) {
        const clonedContainer = container.cloneNode(true);
        clonedContainer.id = 'frozen-graph-container';
        setFrozenViewHtml(clonedContainer.outerHTML);
        setIsFilterTransition(true);
      }
    }

    setFilters((prev) => {
      const next = { ...prev, [key]: checked };
      const sp = new URLSearchParams(location.search);
      if (next.gebruik) sp.set('gebruik', 'true');
      else sp.delete('gebruik');
      if (next.applicaties) sp.set('applicaties', 'true');
      else sp.delete('applicaties');
      if (next.deelnames) sp.set('deelnames', 'true');
      else sp.delete('deelnames');
      const qs = sp.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}`
      );
      return next;
    });
  };

  // Load gebruik, applicaties, deelnames, and module data when filters are active.
  // Uses pre-fetched data from the store (loaded on the views list page) when available,
  // falling back to fetching if the user navigated directly to a view URL.
  useEffect(() => {
    if (!gemma) return;
    const anyFilterActive = filters.gebruik || filters.applicaties || filters.deelnames;
    if (!anyFilterActive) {
      // Only clear if there's actual data to clear — avoids creating a new
      // object reference that would needlessly re-trigger Effect B.
      setOverlayData((prev) => {
        if (prev.gebruik === null && prev.applicaties === null && prev.deelnames === null) return prev;
        return { gebruik: null, applicaties: null, deelnames: null, moduleNames: {} };
      });
      return;
    }

    // Stale guard — prevents old async callbacks from setting state after
    // this effect is cleaned up (e.g. when filters change mid-fetch).
    let stale = false;

    const activeOrgUuid = store?.user?.activeOrganization?.uuid;
    const fields = 'id,module,gebruiktVoorReferentiecomponenten,deelnemers,afnemer,aanbieder,@self';

    const loadData = async () => {
      let nextGebruik = null;
      let nextApplicaties = null;
      let nextDeelnames = null;
      let nextModuleNames = {};

      // Load gebruik (afnemer = our org)
      if (filters.gebruik) {
        nextGebruik = gemma.get_allVoorzieningGebruik;
        if (!nextGebruik) {
          const params = { _limit: 10000, _fields: fields };
          if (activeOrgUuid) params.afnemer = activeOrgUuid;
          await gemma.fetchGebruik(params);
          if (stale) return;
          nextGebruik = gemma.get_allVoorzieningGebruik || [];
        }
      }

      // Load applicaties (aanbieder = our org)
      if (filters.applicaties) {
        nextApplicaties = gemma.get_applicaties;
        if (!nextApplicaties && activeOrgUuid) {
          await gemma.fetchApplicaties({
            _limit: 10000,
            _fields: fields,
            aanbieder: activeOrgUuid,
          });
          if (stale) return;
          nextApplicaties = gemma.get_applicaties || [];
        }
        nextApplicaties = nextApplicaties || [];
      }

      // Load deelnames (deelnemers contains our org)
      if (filters.deelnames) {
        nextDeelnames = gemma.get_deelnames;
        if (!nextDeelnames && activeOrgUuid) {
          await gemma.fetchDeelnames({
            _limit: 10000,
            _fields: fields,
            deelnemers: activeOrgUuid,
          });
          if (stale) return;
          nextDeelnames = gemma.get_deelnames || [];
        }
        nextDeelnames = nextDeelnames || [];
      }

      // Load modules for name lookup
      let modulesData = gemma.get_modules;
      if (!modulesData) {
        modulesData = await gemma.fetchModules({
          _limit: 10000,
          _fields: 'id,naam',
        });
        if (stale) return;
      }
      if (Array.isArray(modulesData)) {
        modulesData.forEach((m) => {
          if (m.id && m.naam) nextModuleNames[m.id] = m.naam;
          if (m.id && m['@self']?.name)
            nextModuleNames[m.id] = nextModuleNames[m.id] || m['@self'].name;
        });
      }

      // Single atomic state update — prevents cascading renders from
      // individual setState calls in async contexts.
      if (!stale) {
        setOverlayData({
          gebruik: nextGebruik,
          applicaties: nextApplicaties,
          deelnames: nextDeelnames,
          moduleNames: nextModuleNames,
        });
      }
    };

    loadData();
    return () => { stale = true; };
  }, [gemma, filters.gebruik, filters.applicaties, filters.deelnames]);

  // Process view data for rendering - prefer new API (viewNodes/viewRelationships)
  useEffect(() => {
    if (!gemma || !gemma.get_view) {
      setViewIsDoneLoading(false);
      return;
    }

    // Check top-level viewNodes first, then xml.viewNodes as fallback
    const sourceNodes = gemma.get_view.viewNodes || gemma.get_view.xml?.viewNodes;
    const sourceRelationships =
      gemma.get_view.viewRelationships || gemma.get_view.xml?.viewRelationships;

    if (Array.isArray(sourceNodes)) {
      const sanitizedNodes = sourceNodes.map((node) => ({
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
        gemmaType:
          node.type || node.gemmaType || node.elementProperties?.gemmaType || null,
      }));
      setViewNodesData(sanitizedNodes);
      setViewRelationsData(sourceRelationships || []);
      return;
    }

    // Fallback to legacy structures if present
    const nodes = gemma.get_view.nodes || [];
    const relationships = gemma.get_view.connections || [];
    setViewNodesData(nodes);
    setViewRelationsData(relationships);
  }, [gemma && gemma.get_view]);

  // ── Effect A — Base render: runs once per view ──
  // Only re-runs when the base node/relation data changes (view switch).
  // Overlay data is handled separately in Effect B for incremental updates.
  useEffect(() => {
    if (!gemma.get_view) return;
    if (!viewNodesData) return;
    if (!viewRelationsData) return;

    setViewIsDoneLoading(false);

    const renderBaseGraph = () => {
      const t0 = performance.now();

      const container = document.getElementById('graph-container');
      if (!container) {
        setTimeout(renderBaseGraph, 100);
        return;
      }

      // Clean up previous graph/paper before creating new ones
      if (graphRef.current) {
        graphRef.current.clear();
        graphRef.current = null;
      }
      if (paperRef.current) {
        paperRef.current.remove();
        paperRef.current = null;
      }
      overlayIdsRef.current = [];
      container.innerHTML = '';

      const outputGraph = new dia.Graph({}, { cellNamespace: shapes });

      const paper = new dia.Paper({
        el: container,
        model: outputGraph,
        width: 1168,
        height: 'auto',
        gridSize: 1,
        interactive: {
          elementMove: false,
          addLinkFromMagnet: false,
          vertexAdd: false,
          vertexRemove: false,
          linkMove: false,
          arrowheadMove: false,
          vertexMove: false,
          useLinkTools: false,
          labelMove: false,
        },
        clickThreshold: 10,
        background: { color: 'rgba(0, 0, 0, 0)' },
      });

      const t1 = performance.now();
      console.info(`[ViewPerf] Graph+Paper init: ${(t1 - t0).toFixed(1)}ms`);

      paper.freeze();

      let viewNodes = [];
      let viewRelationships = [];

      const hasNewFormat =
        Array.isArray(gemma.get_view.viewNodes) ||
        Array.isArray(gemma.get_view.xml?.viewNodes);
      if (hasNewFormat) {
        // Deep-clone base nodes (no overlays — those are added in Effect B).
        const rawNodes = (viewNodesData || []).map((n) => ({ ...n }));

        // Topological sort: parents before children for graph.getCell(parentId).
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
        sorted.push(...remaining);

        // Convert absolute → parent-relative coordinates.
        const absPos = {};
        sorted.forEach((n) => {
          const parentAbs = n.parent ? absPos[n.parent] : null;
          absPos[n.viewNodeId] = { x: n.x || 0, y: n.y || 0 };
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
            ? r.bendpoints.map((b) => ({
                x: parseFloat(b.x) || 0,
                y: parseFloat(b.y) || 0,
              }))
            : [],
          label: {},
        }));
      } else {
        // Legacy fallback
        viewNodes = (viewNodesData || []).map((n) => ({
          modelNodeId: n.elementRef || n.identifier || n.modelNodeId,
          viewNodeId: n.identifier || n.viewNodeId || n.modelNodeId,
          name: n.name || 'unknown',
          type: (n.type || 'dataobject').toLowerCase(),
          x: n.position?.x || n.x || 0,
          y: n.position?.y || n.y || 0,
          width: n.position?.w || n.width || 120,
          height: n.position?.h || n.height || 80,
        }));
        viewRelationships = (viewRelationsData || []).map((r) => ({
          modelRelationshipId: r.relationshipRef || r.identifier,
          sourceId: r.source || r.sourceElementRef,
          targetId: r.target || r.targetElementRef,
          viewRelationshipId: r.identifier,
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

      const tDataReady = performance.now();
      console.info(`[ViewPerf] Base data prep: ${(tDataReady - t1).toFixed(1)}ms — ${viewNodes.length} nodes, ${viewRelationships.length} rels`);

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
      const tRendered = performance.now();
      console.info(`[ViewPerf] ViewRenderer.renderToGraph: ${(tRendered - tDataReady).toFixed(1)}ms`);

      paper.unfreeze();
      const tUnfrozen = performance.now();
      console.info(`[ViewPerf] paper.unfreeze (DOM flush): ${(tUnfrozen - tRendered).toFixed(1)}ms`);

      // Apply colors and viewBox
      const modelIdElements = {};
      container.querySelectorAll('[model-id]').forEach((el) => {
        modelIdElements[el.getAttribute('model-id')] = el;
      });
      viewNodes.forEach((node) => setNodeColor(node, modelIdElements));
      viewRelationships.forEach((rel) => setRelationshipColor(rel, modelIdElements));
      container.querySelectorAll(':scope > svg').forEach((node) => setSvgViewBox(node));

      const tColored = performance.now();
      console.info(`[ViewPerf] Color+viewBox apply: ${(tColored - tUnfrozen).toFixed(1)}ms`);
      console.info(`[ViewPerf] TOTAL base render: ${(tColored - t0).toFixed(1)}ms`);

      // Store refs for overlay effect (Effect B)
      graphRef.current = outputGraph;
      paperRef.current = paper;

      setViewIsDoneLoading(true);

      // Clear frozen view on view switch (base re-render).
      // Effect B will handle clearing during filter transitions.
      setFrozenViewHtml(null);
      setIsFilterTransition(false);
    };

    renderBaseGraph();

    return () => {
      // Cleanup on unmount or when base data changes
      if (graphRef.current) {
        graphRef.current.clear();
        graphRef.current = null;
      }
      if (paperRef.current) {
        paperRef.current.remove();
        paperRef.current = null;
      }
      overlayIdsRef.current = [];
    };
  }, [viewNodesData, viewRelationsData]);

  // ── Effect B — Overlay update: runs on filter toggle ──
  // Incrementally adds/removes overlay cells without rebuilding the base graph.
  // This is the key performance optimization: base nodes stay in DOM.
  // Depends on a single overlayData object (atomic update) to prevent
  // cascading renders from individual data source changes.
  useEffect(() => {
    // Guard: skip if base render hasn't completed
    if (!graphRef.current || !paperRef.current || !viewIsDoneLoading) return;

    const t0 = performance.now();

    // Remove old overlay cells from the existing graph
    if (overlayIdsRef.current.length > 0) {
      overlayIdsRef.current.forEach((id) => {
        const cell = graphRef.current.getCell(id);
        if (cell) cell.remove();
      });
      overlayIdsRef.current = [];
    }

    // Destructure the combined overlay data
    const { gebruik: gebruikData, applicaties: applicatiesData, deelnames: deelnamesData, moduleNames } = overlayData;

    // Collect active overlay data sources
    const overlayColors = {
      gebruik:     { color: '#b9f6ca', borderColor: '#2e7d32', fontColor: '#1b5e20' },
      applicaties: { color: '#ffe0b2', borderColor: '#e65100', fontColor: '#bf360c' },
      deelnames:   { color: '#b3e5fc', borderColor: '#01579b', fontColor: '#01579b' },
    };

    const overlaySources = [];
    if (gebruikData && gebruikData.length > 0) {
      overlaySources.push({ data: gebruikData, type: 'gebruik' });
    }
    if (applicatiesData && applicatiesData.length > 0) {
      overlaySources.push({ data: applicatiesData, type: 'applicaties' });
    }
    if (deelnamesData && deelnamesData.length > 0) {
      overlaySources.push({ data: deelnamesData, type: 'deelnames' });
    }

    if (overlaySources.length === 0) {
      // No overlays to add — clear frozen view and exit
      setFrozenViewHtml(null);
      setIsFilterTransition(false);
      const t1 = performance.now();
      console.info(`[ViewPerf] Overlay cleanup: ${(t1 - t0).toFixed(1)}ms — all overlays removed`);
      return;
    }

    // Build lookup: modelNodeId (with id- prefix) → base viewNode
    // NOTE: viewNodesData is intentionally excluded from deps.
    // When the view changes, viewIsDoneLoading transitions false→true,
    // which re-triggers this effect with the correct viewNodesData.
    const viewNodeByModelId = {};
    (viewNodesData || []).forEach((n) => {
      if (n.modelNodeId) viewNodeByModelId[n.modelNodeId] = n;
    });

    // Freeze paper for batch rendering of overlay cells
    paperRef.current.freeze();

    const newOverlayIds = [];
    const overlayCountPerParent = {};
    let totalOverlays = 0;
    const MAX_OVERLAYS = 2000;

    overlaySources.forEach(({ data, type }) => {
      const colors = overlayColors[type];

      data.forEach((record) => {
        if (totalOverlays >= MAX_OVERLAYS) return;
        const refComps = record.gebruiktVoorReferentiecomponenten;
        if (!Array.isArray(refComps) || refComps.length === 0) return;

        const moduleName = moduleNames[record.module] || 'Module';

        refComps.forEach((refCompUuid) => {
          if (totalOverlays >= MAX_OVERLAYS) return;

          const modelNodeId = `id-${refCompUuid}`;
          const parentNode = viewNodeByModelId[modelNodeId];
          if (!parentNode) return;

          const parentId = parentNode.viewNodeId;
          const parentCell = graphRef.current.getCell(parentId);
          if (!parentCell) return;

          if (!overlayCountPerParent[parentId]) overlayCountPerParent[parentId] = 0;
          const stackIndex = overlayCountPerParent[parentId]++;
          totalOverlays++;

          const overlayHeight = 18;
          const overlayGap = 2;
          const overlayWidth = (parentNode.width || 120) - 10;
          const overlayX = 5;
          const overlayY = Math.max(20, (parentNode.height || 80) - 5 - ((stackIndex + 1) * (overlayHeight + overlayGap)));

          const overlayId = `overlay-${record.id}-${refCompUuid}`;

          // Create overlay directly as a simple rectangle — bypasses
          // ViewRenderer entirely (no glyph generation, no ArchiMate type
          // processing). Colors are set on creation, no post-render DOM pass.
          const rect = new shapes.standard.Rectangle({
            id: overlayId,
            size: { width: overlayWidth, height: overlayHeight },
            attrs: {
              body: {
                fill: colors.color,
                stroke: colors.borderColor,
                strokeWidth: 0.8,
                rx: 4,
                ry: 4,
              },
              label: {
                text: moduleName,
                fill: colors.fontColor,
                fontSize: 9,
                fontFamily: 'Segoe UI',
              },
            },
          });

          rect.addTo(graphRef.current);
          parentCell.embed(rect);
          rect.position(overlayX, overlayY, { parentRelative: true });

          newOverlayIds.push(overlayId);
        });
      });
    });

    overlayIdsRef.current = newOverlayIds;

    // Unfreeze: only renders the new overlay cells (base stays untouched)
    paperRef.current.unfreeze();

    const t1 = performance.now();
    console.info(`[ViewPerf] Overlay update: ${(t1 - t0).toFixed(1)}ms — ${newOverlayIds.length} overlays added`);

    // Clear frozen view overlay now that overlays are rendered
    setFrozenViewHtml(null);
    setIsFilterTransition(false);
  }, [overlayData, viewIsDoneLoading]);

  // Helper functions from public version
  const setSvgViewBox = (svg) => {
    const box = svg.querySelector('g').getBBox();
    svg.setAttribute('id', 'svg-container');
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`);
    svg.style.width = '100%';
    svg.style.height = '800px';
    svg.style.border = '1px solid #ccc';
    svg.style.cursor = 'grab';
    const existingGroup = svg.querySelector('g');
    if (existingGroup) {
      existingGroup.setAttribute('transform', `translate(0, 0) scale(1)`);
    }
  };

  const setNodeColor = (node, modelIdElements) => {
    const parentElement = modelIdElements
      ? modelIdElements[node.viewNodeId]
      : document.querySelector(`[model-id="${node.viewNodeId}"]`);
    if (!parentElement) return;
    if (node.type?.toLowerCase() !== 'label') {
      parentElement.setAttribute('data-tooltip-id', TOOLTIP_ID);
      if (node.description)
        parentElement.setAttribute('data-tooltip-content', node.description);
    }
    const allRectElements = parentElement.querySelectorAll(':scope > rect');
    allRectElements.forEach((item) => {
      if (node?.color) item.setAttribute('fill', node?.color);
      if (node?.borderColor) item.setAttribute('stroke', node?.borderColor);
    });
    const allPolygonElements = parentElement.querySelectorAll(':scope > polygon');
    allPolygonElements.forEach((item) => {
      if (node?.color) item.setAttribute('fill', node?.color);
      if (node?.borderColor) item.setAttribute('stroke', node?.borderColor);
    });
    const allTextElements = parentElement.querySelectorAll(':scope > text');
    allTextElements.forEach((item) => {
      if (node?.font?.name) item.setAttribute('font-family', node?.font?.name);
      if (node?.font?.size) item.setAttribute('font-size', node?.font?.size);
      if (node?.font?.color) item.setAttribute('font-color', node?.font?.color);
      if (node?.font?.style) item.setAttribute('font-style', node?.font?.style);
      if (node?.font?.style === 'bold') item.setAttribute('font-weight', 'bold');
      if (node.type?.toLowerCase() === 'label') {
        const currentTransform = item.getAttribute('transform');
        if (currentTransform && currentTransform.includes('matrix')) {
          const matrix = currentTransform.match(
            /matrix\(1,0,0,1,(\d+\.?\d*),(\d+\.?\d*)\)/
          );
          if (matrix) {
            const leftPadding = 10;
            item.setAttribute(
              'transform',
              `matrix(1,0,0,1,${leftPadding},${matrix[2]})`
            );
          }
        }
        item.setAttribute('text-anchor', 'start');
        const tspans = item.querySelectorAll('tspan');
        tspans.forEach((tspan) => {
          tspan.setAttribute('x', '0');
        });
      }
    });
  };

  const setRelationshipColor = (relationship, modelIdElements) => {
    const parentElement = modelIdElements
      ? modelIdElements[relationship.viewRelationshipId]
      : document.querySelector(`[model-id="${relationship.viewRelationshipId}"]`);
    if (!parentElement) return;
    const allPathElements = parentElement.querySelectorAll(':scope > path');
    allPathElements.forEach((item) => {
      item.setAttribute('cursor', 'drag');
    });
    const allTextElements = parentElement.querySelectorAll(':scope text');
    allTextElements.forEach((item) => {
      if (relationship?.label?.markup?.[0]?.style?.fontFamily)
        item.style.setProperty(
          'font-family',
          relationship?.label?.markup?.[0]?.style?.fontFamily
        );
      if (relationship?.label?.markup?.[0]?.style?.fontSize) {
        const fontSize = relationship.label.markup[0].style.fontSize;
        const fontSizeWithUnit = fontSize.toString().match(/\d+$/)
          ? `${fontSize}px`
          : fontSize;
        item.style.setProperty('font-size', fontSizeWithUnit);
      }
      if (relationship?.label?.markup?.[0]?.style?.fontColor)
        item.style.setProperty(
          'fill',
          relationship?.label?.markup?.[0]?.style?.fontColor
        );
      if (relationship?.label?.markup?.[0]?.style?.fontStyle)
        item.style.setProperty(
          'font-style',
          relationship?.label?.markup?.[0]?.style?.fontStyle
        );
      if (relationship?.label?.markup?.[0]?.style?.fontWeight === 'bold')
        item.style.setProperty('font-weight', 'bold');
    });
  };

  // Pan/Zoom behavior similar to public viewer
  // Only re-inits when base render completes — filter toggles preserve pan/zoom state.
  useEffect(() => {
    if (!gemma || !gemma.get_view || !viewIsDoneLoading) return;

    const initTimer = setTimeout(() => {
      const svg = document.getElementById('svg-container');
      if (!svg) return;

      // Validate SVG has content before initializing pan/zoom
      const gElement = svg.querySelector('g');
      if (!gElement) {
        console.warn('SVG has no <g> element, skipping pan/zoom initialization');
        return;
      }

      try {
        const bbox = gElement.getBBox();
        // Check if bounding box is valid (has width and height)
        if (
          !bbox ||
          bbox.width === 0 ||
          bbox.height === 0 ||
          !isFinite(bbox.width) ||
          !isFinite(bbox.height)
        ) {
          console.warn(
            'SVG has invalid bounding box, skipping pan/zoom initialization'
          );
          return;
        }
      } catch (e) {
        console.warn(
          'Could not get SVG bounding box, skipping pan/zoom initialization:',
          e
        );
        return;
      }

      try {
        if (panZoomInstance && typeof panZoomInstance.destroy === 'function') {
          panZoomInstance.destroy();
        }
        const existingControls = svg.querySelector('.svg-pan-zoom-control');
        if (existingControls) existingControls.remove();
      } catch (_e) {
        /* ignore cleanup errors */
      }

      const existingGroup = svg.querySelector('g');
      if (existingGroup)
        existingGroup.setAttribute('transform', 'translate(0,0) scale(1)');

      let svgHovered = false;
      let touchStarted = false;
      let initialPinchDistance = null;
      let initialScale = null;
      let lastPinchCenter = null;

      try {
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
                options.svgElement.setAttribute(
                  'class',
                  svgHovered ? 'hovered' : ''
                );
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
                    const currentDistance = Math.hypot(
                      touch2.clientX - touch1.clientX,
                      touch2.clientY - touch1.clientY
                    );
                    const currentCenter = getTouchCenter(touch1, touch2);
                    if (initialPinchDistance && initialScale && lastPinchCenter) {
                      const scaleFactor = currentDistance / initialPinchDistance;
                      const newScale = Math.min(
                        Math.max(initialScale * scaleFactor, 0.1),
                        10
                      );
                      const svgPoint = getRelativePoint(
                        options.svgElement,
                        currentCenter.x,
                        currentCenter.y
                      );
                      const zoomPoint = { x: svgPoint.x, y: svgPoint.y };
                      options.instance.zoom(newScale, zoomPoint);
                      if (lastPinchCenter) {
                        const dx = currentCenter.x - lastPinchCenter.x;
                        const dy = currentCenter.y - lastPinchCenter.y;
                        options.instance.panBy({ x: dx, y: dy });
                      }
                      lastPinchCenter = currentCenter;
                    }
                  } else if (evt.touches.length === 1) {
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
      } catch (error) {
        console.error('Error initializing svgPanZoom:', error);
        // Don't set panZoomInstance if initialization failed
      }
    }, 100);

    return () => {
      clearTimeout(initTimer);
      try {
        if (panZoomInstance && typeof panZoomInstance.destroy === 'function') {
          panZoomInstance.destroy();
        }
      } catch (_e) {
        /* ignore cleanup errors */
      }
      setPanZoomInstance(null);
    };
  }, [gemma, viewIsDoneLoading]);

  // Download SVG (aligned with public viewer)
  const downloadSvg = () => {
    const svg = document.getElementById('svg-container');
    if (!svg) return;
    const clonedSvg = svg.cloneNode(true);
    const zoomControls = clonedSvg.querySelector('.svg-pan-zoom-control');
    if (zoomControls) {
      zoomControls.remove();
    }
    clonedSvg.style.cursor = 'default';
    const elementsWithTooltips = clonedSvg.querySelectorAll(
      '[data-tooltip-content]'
    );
    elementsWithTooltips.forEach((element) => {
      const tooltipContent = element.getAttribute('data-tooltip-content');
      if (tooltipContent) {
        element.removeAttribute('data-tooltip-id');
        element.removeAttribute('data-tooltip-content');
        const titleElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'title'
        );
        titleElement.textContent = tooltipContent;
        element.insertBefore(titleElement, element.firstChild);
      }
    });
    const svgData = clonedSvg.outerHTML
      .replace(/&nbsp;/g, '&#160;')
      .replace(/xmlns=".*?"/g, '')
      .replace(/<svg /g, '<svg xmlns="http://www.w3.org/2000/svg" ');
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = (getViewName(gemma.get_view) || 'gemma')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    a.download = `${fileName}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />
        <div className='ac-beheer-details--100-width'>
          {/* View Selection Header */}
          <div className='con-beheer-views-header'>
            <div className='con-beheer-views-title-section'>
              <h1>
                {gemma.get_view
                  ? getViewName(gemma.get_view)
                  : 'GEMMA weergaven beheer'}
              </h1>
              <p>
                {gemma.get_view
                  ? gemma.get_view.documentation ||
                    'Geselecteerde weergave wordt getoond'
                  : 'Beheer en bekijk GEMMA weergaven'}
              </p>
            </div>

            {/* Acties */}
            {gemma?.get_view && !gemma?.get_viewError && (
              <div className='con-beheer-views-actions'>
                <ConActionMenu className='ac-gemma-view-header-download-button'>
                  <ConActionMenu.Trigger icon={<VISUALS.ELLIPSIS />}>
                    Acties
                  </ConActionMenu.Trigger>

                  <ConActionMenu.Menu position='right'>
                    <ConActionMenu.Button
                      icon={<VISUALS.DOWNLOAD />}
                      onClick={downloadSvg}
                      disabled={!viewIsDoneLoading}
                    >
                      Download SVG
                    </ConActionMenu.Button>
                    <ConActionMenu.Button
                      icon={<VISUALS.DOWNLOAD />}
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            '/api/apps/softwarecatalog/api/archimate/export',
                            {
                              method: 'POST',
                              headers: {
                                Accept: 'application/xml',
                              },
                            }
                          );

                          if (!response.ok) {
                            throw new Error(
                              `HTTP error! status: ${response.status}`
                            );
                          }

                          // Get the XML content
                          const xmlData = await response.text();

                          // Extract filename from Content-Disposition header if available
                          const disposition =
                            response.headers.get('content-disposition');
                          const filenameMatch =
                            disposition?.match(/filename="?([^";]+)"?/i);
                          const filename =
                            filenameMatch?.[1] ||
                            `${getViewName(gemma.get_view)
                              .replace(/[^a-z0-9]/gi, '_')
                              .toLowerCase()}_amef.xml`;

                          // Create blob and download
                          const blob = new Blob([xmlData], {
                            type: 'application/xml;charset=utf-8',
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = filename;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);

                          // Cleanup
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error downloading AMEF:', error);
                          // You might want to show a user-friendly error message here
                        }
                      }}
                      disabled={!viewIsDoneLoading}
                    >
                      Download AMEF
                    </ConActionMenu.Button>
                  </ConActionMenu.Menu>
                </ConActionMenu>
              </div>
            )}
          </div>

          {/* Filters Section */}
          {gemma?.get_view && !gemma?.get_viewError && (
            <div className='con-beheer-views-filters-section'>
              <div className='con-beheer-views-filters-header'>
                <h3>Weergave filters</h3>
                <p>
                  Pas de weergave aan door specifieke elementen te tonen of te
                  verbergen
                </p>
              </div>

              <div className='con-beheer-views-filters-flex'>
                <AcCheckbox
                  label='Gebruik'
                  checked={filters.gebruik}
                  tooltip={
                    'Toon elementen gerelateerd aan het gebruik van diensten en applicaties'
                  }
                  onChange={handleToggleFilter('gebruik')}
                />

                <AcCheckbox
                  label='Applicaties'
                  checked={filters.applicaties}
                  tooltip={
                    'Toon applicaties die uw organisatie aanbiedt en hun onderlinge relaties'
                  }
                  onChange={handleToggleFilter('applicaties')}
                />

                <AcCheckbox
                  label='Deelnames'
                  checked={filters.deelnames}
                  tooltip={
                    'Toon deelname-gerelateerde elementen en participatie-aspecten'
                  }
                  onChange={handleToggleFilter('deelnames')}
                />
              </div>
            </div>
          )}

          {/* Loading State */}
          {gemma?.is_loading && !gemma?.get_view && <AcLoader />}

          {/* Error State */}
          {gemma?.get_viewError && (
            <div className='con-beheer-views-error'>
              <h2>Weergave niet gevonden</h2>
              <p>
                De opgevraagde weergave kon niet worden gevonden of er was een fout
                bij het laden.
              </p>
              <p>Controleer de selectie en probeer het opnieuw.</p>
            </div>
          )}

          {/* View Content */}
          {gemma?.get_view && !gemma?.get_viewError && (
            <>
              {/* Graph Container */}
              {viewNodesData && viewRelationsData && (
                <div style={{ position: 'relative' }}>
                  {/* Frozen view overlay during filter transition */}
                  {frozenViewHtml && isFilterTransition && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: frozenViewHtml }}
                        style={{
                          opacity: 0.6,
                          filter: 'grayscale(50%)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AcLoader />
                      </div>
                    </div>
                  )}

                  {/* Real graph container */}
                  <div
                    className='con-beheer-views-graph-container'
                    id='graph-container'
                    style={{
                      visibility: isFilterTransition ? 'hidden' : 'visible',
                    }}
                  ></div>
                </div>
              )}

              {/* Loading indicator for graph rendering */}
              {gemma?.get_view && !viewIsDoneLoading && !isFilterTransition && (
                <div className='con-beheer-views-graph-loading'>
                  <AcLoader />
                  <p>Weergave wordt geladen...</p>
                </div>
              )}
            </>
          )}

          {/* No View Loaded */}
          {!gemma?.is_loading && !gemma?.get_view && (
            <div className='con-beheer-views-no-data'>
              <h2>Geen weergaven beschikbaar</h2>
              <p>
                Er zijn momenteel geen GEMMA weergaven beschikbaar om te beheren.
              </p>
            </div>
          )}
        </div>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(ConBeheerViews));

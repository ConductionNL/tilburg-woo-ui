import { useEffect, useState } from 'react';
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
  const [filters, setFilters] = useState({
    gebruik: false,
    product: false,
    deelnames: false,
  });

  // Sync filters from URL
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const gebruik = sp.get('gebruik') === 'true';
    const product = sp.get('product') === 'true';
    const deelnames = sp.get('deelnames') === 'true';
    setFilters({ gebruik, product, deelnames });
  }, [location.search]);

  // Load view by route param when present (include filters)
  useEffect(() => {
    if (!gemma) return;
    if (!params?.id) return;
    setViewIsDoneLoading(false);
    const q = {};
    if (filters.gebruik) q.gebruik = true;
    if (filters.product) q.product = true;
    if (filters.deelnames) q.deelnames = true;
    gemma.fetchView(params.id, q);
  }, [gemma, params?.id, filters.gebruik, filters.product, filters.deelnames]);

  // Helper function to get view name
  const getViewName = (view) => {
    const inlineTitle =
      typeof view?.titelViewSwc === 'string' ? view.titelViewSwc.trim() : '';
    if (inlineTitle) return inlineTitle;
    return view?.name || view['@self'].name || 'Unnamed View';
  };

  // Update URL when filters change (keep existing params)
  const handleToggleFilter = (key) => (checked) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: checked };
      const sp = new URLSearchParams(location.search);
      if (next.gebruik) sp.set('gebruik', 'true');
      else sp.delete('gebruik');
      if (next.product) sp.set('product', 'true');
      else sp.delete('product');
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

  // Process view data for rendering - prefer new API (viewNodes/viewRelationships)
  useEffect(() => {
    if (!gemma || !gemma.get_view) {
      setViewIsDoneLoading(false);
      return;
    }

    setViewIsDoneLoading(false);

    // Check top-level viewNodes first, then xml.viewNodes as fallback
    const sourceNodes = gemma.get_view.viewNodes || gemma.get_view.xml?.viewNodes;
    const sourceRelationships = gemma.get_view.viewRelationships || gemma.get_view.xml?.viewRelationships;

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
        gemmaType: node.type || node.gemmaType || node.elementProperties?.gemmaType || null,
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

  // Render view when data is ready (same logic as public version)
  useEffect(() => {
    if (!gemma.get_view) return;
    if (!viewNodesData) return;
    if (!viewRelationsData) return;

    // Small delay to ensure DOM is ready
    const renderBeheerGraph = () => {
      // Create container in HTML
      const container = document.getElementById('graph-container');

      if (!container) {
        // Retry after a short delay
        setTimeout(renderBeheerGraph, 100);
        return;
      }

      // Clear previous content
      container.innerHTML = '';

      // Initialize the graph
      let outputGraph = new dia.Graph({}, { cellNamespace: shapes });

      new dia.Paper({
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
        background: {
          color: 'rgba(0, 0, 0, 0)',
        },
      });

      const t0 = performance.now();

      let viewNodes = [];
      let viewRelationships = [];

      const hasNewFormat = Array.isArray(gemma.get_view.viewNodes) || Array.isArray(gemma.get_view.xml?.viewNodes);
      if (hasNewFormat) {
        // Topological sort: parents must be rendered before children so the
        // diagram engine can look up parent cells via graph.getCell(parentId).
        // Backend now stores nodes in correct order, but we keep this as a
        // safety net for data imported before the fix.
        const rawNodes = viewNodesData || [];
        const sorted = [];
        const placed = new Set();
        const remaining = [...rawNodes];
        let prevLength = -1;
        while (remaining.length > 0 && remaining.length !== prevLength) {
          prevLength = remaining.length;
          for (let i = remaining.length - 1; i >= 0; i--) {
            const n = remaining[i];
            if (!n.parent || placed.has(n.parent)) {
              sorted.push(n);
              placed.add(n.viewNodeId);
              remaining.splice(i, 1);
            }
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
        // Legacy fallback: map minimal fields
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

      // Render the graph (match public views list for consistent colors)
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

      // Apply colors and viewBox like public version
      viewNodes.forEach((node) => {
        setNodeColor(node);
      });
      viewRelationships.forEach((relationship) => {
        setRelationshipColor(relationship);
      });
      container.querySelectorAll(':scope > svg').forEach((node) => {
        setSvgViewBox(node);
      });

      const t1 = performance.now();
      console.info(`[AMEF] Rendered ${viewNodes.length} nodes + ${viewRelationships.length} rels in ${(t1 - t0).toFixed(0)}ms`);

      // Always set loading done when we reach this point
      setViewIsDoneLoading(true);
    };

    // Start rendering process
    renderBeheerGraph();
  }, [viewNodesData, viewRelationsData]);

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

  const setNodeColor = (node) => {
    const parentElement = document.querySelector(`[model-id="${node.viewNodeId}"]`);
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

  const setRelationshipColor = (relationship) => {
    const parentElement = document.querySelector(
      `[model-id="${relationship.viewRelationshipId}"]`
    );
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
  useEffect(() => {
    if (
      !gemma ||
      !gemma.get_view ||
      !viewIsDoneLoading ||
      !viewNodesData ||
      !viewRelationsData
    )
      return;

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
        if (!bbox || bbox.width === 0 || bbox.height === 0 || !isFinite(bbox.width) || !isFinite(bbox.height)) {
          console.warn('SVG has invalid bounding box, skipping pan/zoom initialization');
          return;
        }
      } catch (e) {
        console.warn('Could not get SVG bounding box, skipping pan/zoom initialization:', e);
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
  }, [gemma, viewIsDoneLoading, viewNodesData, viewRelationsData]);

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
                                'Accept': 'application/xml',
                              },
                            }
                          );

                          if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                          }

                          // Get the XML content
                          const xmlData = await response.text();

                          // Extract filename from Content-Disposition header if available
                          const disposition = response.headers.get('content-disposition');
                          const filenameMatch = disposition?.match(/filename="?([^";]+)"?/i);
                          const filename = filenameMatch?.[1] || `${getViewName(gemma.get_view).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_amef.xml`;

                          // Create blob and download
                          const blob = new Blob([xmlData], { type: 'application/xml;charset=utf-8' });
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
                  label='Product'
                  checked={filters.product}
                  tooltip={
                    'Toon product-gerelateerde elementen en hun onderlinge relaties'
                  }
                  onChange={handleToggleFilter('product')}
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
                <div
                  className='con-beheer-views-graph-container'
                  id='graph-container'
                ></div>
              )}

              {/* Loading indicator for graph rendering */}
              {gemma?.get_view && !viewIsDoneLoading && (
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

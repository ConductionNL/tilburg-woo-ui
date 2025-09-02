import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useLocation } from 'react-router';
import { AcFlex, AcSection } from '@atoms';
import { withStore } from '@stores';
import { PrimaryActionButton } from '@utrecht/component-library-react/dist/css-module';
import { AcLoader, ConDynamicSidenav } from '@components';
import { TOOLTIP_ID } from '@src/index.web';
import { dia, shapes } from 'jointjs';
import { ViewRenderer, ViewSettings } from '@conduction/archimate-diagram-engine';
import svgPanZoom from 'svg-pan-zoom';
import { AcCheckbox } from '@molecules';

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
  const [filters, setFilters] = useState({ gebruik: false, product: false });

  // Sync filters from URL
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const gebruik = sp.get('gebruik') === 'true';
    const product = sp.get('product') === 'true';
    setFilters({ gebruik, product });
  }, [location.search]);

  // Load view by route param when present (include filters)
  useEffect(() => {
    if (!gemma) return;
    if (!params?.id) return;
    setViewIsDoneLoading(false);
    const q = {};
    if (filters.gebruik) q.gebruik = true;
    if (filters.product) q.product = true;
    gemma.fetchView(params.id, q);
  }, [gemma, params?.id, filters.gebruik, filters.product]);

  // Helper function to get view name
  const getViewName = (view) => {
    const inlineTitle =
      typeof view?.titelViewSwc === 'string' ? view.titelViewSwc.trim() : '';
    if (inlineTitle) return inlineTitle;
    return view?.name || 'Unnamed View';
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
      const qs = sp.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}`
      );
      return next;
    });
  };

  // Process view data for rendering - using nested data directly
  useEffect(() => {
    if (!gemma.get_view) {
      setViewIsDoneLoading(false);
      return;
    }

    // Reset loading state
    setViewIsDoneLoading(false);

    // Extract nodes and relationships directly from the view response
    const nodes = gemma.get_view.nodes || gemma.get_view.viewNodes || [];
    const relationships =
      gemma.get_view.connections || gemma.get_view.viewRelationships || [];

    // Set the data directly - no additional API calls needed
    setViewNodesData(nodes);
    setViewRelationsData(relationships);

    // Set loading complete
    setViewIsDoneLoading(true);
  }, [gemma.get_view]);

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
        height: 800,
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

      // Convert nodes function - data is already nested in API response
      const convertToViewNode = (node) => {
        // Handle both API response structures
        return {
          modelNodeId: node.modelNodeId || node.elementRef || node.identifier,
          viewNodeId: node.viewNodeId || node.identifier || node.modelNodeId,
          name: node.name || 'Unknown',
          type: node.type || 'dataobject',
          x: node.x || 0,
          y: node.y || 0,
          width: node.width || 120,
          height: node.height || 80,
          style: {
            fillColor: node.color || '#ffffff',
            color: node.borderColor || '#000000',
          },
          description: node.description || null,
        };
      };

      // Convert relationships function - data is already nested in API response
      const convertToViewRelationship = (relationship) => {
        return {
          modelRelationshipId:
            relationship.modelRelationshipId ||
            relationship.relationshipRef ||
            relationship.identifier,
          viewRelationshipId:
            relationship.viewRelationshipId || relationship.identifier,
          name: relationship.name || relationship.label || '',
          type: relationship.type || 'association',
          sourceId:
            relationship.sourceId ||
            relationship.sourceElementRef ||
            relationship.source,
          targetId:
            relationship.targetId ||
            relationship.targetElementRef ||
            relationship.target,
        };
      };

      // Convert nodes for rendering - use already processed data
      const viewNodes = (viewNodesData || []).map(convertToViewNode).filter(Boolean);

      // Convert relationships for rendering - use already processed data
      const viewRelationships = (viewRelationsData || [])
        .map(convertToViewRelationship)
        .filter(Boolean);

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
            <div>
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

            {/* Filters and Download Button */}
            <div className='con-views-dropdown-container'>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <AcCheckbox
                  label='Gebruik'
                  checked={filters.gebruik}
                  onChange={(checked) => handleToggleFilter('gebruik')(checked)}
                />
                <AcCheckbox
                  label='Product'
                  checked={filters.product}
                  onChange={(checked) => handleToggleFilter('product')(checked)}
                />
              </div>

              {/* Download SVG Button - Next to dropdown */}
              {gemma?.get_view && !gemma?.get_viewError && (
                <PrimaryActionButton
                  onClick={downloadSvg}
                  disabled={!viewIsDoneLoading}
                  data-tooltip-id={TOOLTIP_ID}
                  data-tooltip-content='Download weergave als SVG'
                  style={{ marginLeft: '1rem' }}
                >
                  Download SVG
                </PrimaryActionButton>
              )}
            </div>
          </div>

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

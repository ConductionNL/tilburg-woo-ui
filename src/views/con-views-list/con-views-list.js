import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router';
import { AcContainer } from '@atoms';
import { withStore } from '@stores';
import { PrimaryActionButton } from '@utrecht/component-library-react/dist/css-module';
import { AcLoader } from '@components';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import ReactSelect from 'react-select';
import { dia, shapes } from 'jointjs';
import { ViewRenderer, ViewSettings } from '@conduction/archimate-diagram-engine';
import svgPanZoom from 'svg-pan-zoom';

/**
 * Public Views List Component
 * Displays a dropdown to select views and renders the selected view
 */
const ConViewsList = ({ store }) => {
  const { gemma } = store || {};
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [selectedView, setSelectedView] = useState(null);
  const [viewNodesData, setViewNodesData] = useState(null);
  const [viewRelationsData, setViewRelationsData] = useState(null);
  const [viewIsDoneLoading, setViewIsDoneLoading] = useState(false);
  const [panZoomInstance, setPanZoomInstance] = useState(null);

  const getViewName = (view) => {
    const inlineTitle =
      typeof view?.titelViewSwc === 'string' ? view.titelViewSwc.trim() : '';
    if (inlineTitle) return inlineTitle;
    return view?.name || 'Unnamed View';
  };

  // Load views list on component mount
  useEffect(() => {
    if (!gemma) return;
    if (!gemma.all_views || gemma.all_views.length === 0) {
      gemma.fetchViews();
    }
  }, [gemma]);

  // Handle URL query parameter for selected view
  useEffect(() => {
    if (!gemma) return;
    const searchParams = new URLSearchParams(location.search);
    const selectedId = searchParams.get('selected');
    if (selectedId && Array.isArray(gemma.all_views) && gemma.all_views.length > 0) {
      const view = gemma.all_views.find((v) => String(v.id) === String(selectedId));
      if (view) {
        const viewOption = { value: view.id, label: getViewName(view), data: view };
        setSelectedView(viewOption);
        if (!gemma.get_view || String(gemma.get_view.id) !== String(selectedId)) {
          setViewIsDoneLoading(false);
          gemma.fetchView(view.id);
        }
      }
    }
  }, [location.search, gemma ? gemma.all_views?.length : 0]);

  // Handle view selection from dropdown
  const handleViewSelection = (selectedOption) => {
    if (selectedOption) {
      setSelectedView(selectedOption);

      // Update URL with selected view ID
      const newUrl = `/views?selected=${selectedOption.value}`;
      navigate(newUrl);
    }
  };

  // Create options for the dropdown
  const viewOptions = (gemma.all_views || []).map((view) => ({
    value: view.id,
    label: getViewName(view),
    data: view,
  }));

  // Process view data for rendering - prefer new API (viewNodes/viewRelationships)
  useEffect(() => {
    if (!gemma || !gemma.get_view) {
      setViewIsDoneLoading(false);
      return;
    }
    setViewIsDoneLoading(false);
    if (Array.isArray(gemma.get_view.viewNodes)) {
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
          node.type ||
          node.elementProperties?.gemmaType ||
          'dataobject'
        ).toLowerCase(),
      }));
      setViewNodesData(sanitizedNodes);
      setViewRelationsData(gemma.get_view.viewRelationships || []);
      return;
    }
    // Fallback to legacy structures if present
    const nodes = gemma.get_view.nodes || [];
    const relationships = gemma.get_view.connections || [];
    setViewNodesData(nodes);
    setViewRelationsData(relationships);
  }, [gemma && gemma.get_view]);

  // Render view when data is ready using the AC Gemma viewer approach
  useEffect(() => {
    if (!gemma || !gemma.get_view) return;
    if (!viewNodesData || !viewRelationsData) return;

    const renderGraph = () => {
      const container = document.getElementById('graph-container');
      if (!container) {
        setTimeout(renderGraph, 50);
        return;
      }

      // Clear previous content
      container.innerHTML = '';

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

      // Click handler (future use)
      paper.on('element:pointerclick', (elementView) => {
        const model = elementView.model;
        const onClick = model.prop('onClick');
        if (typeof onClick === 'function') {
          onClick();
        }
      });

      let viewNodes = [];
      let viewRelationships = [];

      if (Array.isArray(gemma.get_view.viewNodes)) {
        viewNodes = viewNodesData || [];
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

      setViewIsDoneLoading(true);
    };

    renderGraph();
  }, [
    gemma && gemma.get_view && gemma.get_view.id,
    Array.isArray(viewNodesData) ? viewNodesData.length : undefined,
    Array.isArray(viewRelationsData) ? viewRelationsData.length : undefined,
  ]);

  // Pan/Zoom behavior similar to AC Gemma viewer
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

  // Helper function to download SVG (aligned with ac-gemma-view)
  const downloadSvg = () => {
    const svg = document.getElementById('svg-container');
    if (!svg) return;

    // Clone SVG for safe modifications
    const clonedSvg = svg.cloneNode(true);

    // Remove zoom controls from cloned SVG
    const zoomControls = clonedSvg.querySelector('.svg-pan-zoom-control');
    if (zoomControls) {
      zoomControls.remove();
    }

    // Reset cursor style
    clonedSvg.style.cursor = 'default';

    // Convert React tooltips to native SVG <title>
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

    // Ensure xmlns and replace nbsp entities
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

  if (!gemma) {
    return (
      <AcContainer spacing='lg'>
        <div>Store not available</div>
      </AcContainer>
    );
  }

  return (
    <AcContainer spacing='lg'>
      {/* View Selection Header - ALWAYS VISIBLE */}
      <div className='con-views-list-header'>
        <div>
          <h1>
            {gemma.get_view && selectedView
              ? getViewName(gemma.get_view)
              : 'GEMMA weergaven'}
          </h1>
          <p>
            {gemma.get_view && selectedView
              ? gemma.get_view.description ||
                gemma.get_view.documentation ||
                'Geselecteerde weergave wordt getoond'
              : 'Selecteer een weergave om deze te bekijken'}
          </p>
        </div>

        {/* View Selection Dropdown and Download Button */}
        <div className='con-views-dropdown-container'>
          <ReactSelect
            options={viewOptions}
            value={selectedView}
            onChange={handleViewSelection}
            placeholder='Selecteer een weergave...'
            isLoading={gemma.is_loading}
            isDisabled={gemma.is_loading || viewOptions.length === 0}
            className='con-views-dropdown'
            classNamePrefix='con-views-dropdown'
          />

          {/* Download SVG Button - Next to dropdown */}
          {gemma.get_view && !gemma.get_viewError && (
            <PrimaryActionButton
              onClick={downloadSvg}
              disabled={!viewIsDoneLoading}
              data-tooltip-id={TOOLTIP_ID}
              data-tooltip-content='Download weergave als SVG'
              style={{ marginLeft: '1rem' }}
              className='ac-gemma-view-header-download-button'
            >
              <VISUALS.DOWNLOAD /> Download SVG
            </PrimaryActionButton>
          )}
        </div>
      </div>

      {/* Loading State */}
      {gemma.is_loading && !gemma.get_view && <AcLoader />}

      {/* Error State */}
      {gemma.get_viewError && (
        <div className='con-views-error'>
          <h2>Weergave niet gevonden</h2>
          <p>
            De opgevraagde weergave kon niet worden gevonden of er was een fout bij
            het laden.
          </p>
          <p>Controleer de selectie en probeer het opnieuw.</p>
        </div>
      )}

      {/* View Content */}
      {gemma.get_view && !gemma.get_viewError && (
        <>
          {/* Graph Container */}
          {viewNodesData && viewRelationsData && (
            <div className='con-views-graph-container' id='graph-container'></div>
          )}

          {/* Loading indicator for graph rendering */}
          {gemma.get_view && !viewIsDoneLoading && (
            <div className='con-views-graph-loading'>
              <AcLoader />
              <p>Weergave wordt geladen...</p>
            </div>
          )}
        </>
      )}

      {/* No Views Available */}
      {!gemma.is_loading && viewOptions.length === 0 && (
        <div className='con-views-no-data'>
          <h2>Geen weergaven beschikbaar</h2>
          <p>Er zijn momenteel geen GEMMA weergaven beschikbaar om te bekijken.</p>
        </div>
      )}
    </AcContainer>
  );
};

export default withStore(observer(ConViewsList));

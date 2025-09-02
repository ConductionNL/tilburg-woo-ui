import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate, useLocation } from 'react-router';
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
  // Safety check for store
  if (!store || !store.gemma) {
    return (
      <AcContainer spacing='lg'>
        <div>Store not available</div>
      </AcContainer>
    );
  }

  const { gemma } = store;
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [selectedView, setSelectedView] = useState(null);
  const [viewNodesData, setViewNodesData] = useState(null);
  const [viewRelationsData, setViewRelationsData] = useState(null);
  const [viewIsDoneLoading, setViewIsDoneLoading] = useState(false);

  // Load views list on component mount
  useEffect(() => {
    if (!gemma.all_views || gemma.all_views.length === 0) {
      console.log('🔄 Fetching views...');
      gemma.fetchViews();
    }
  }, [gemma]);

  // Handle URL query parameter for selected view
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const selectedId = searchParams.get('selected');
    
    if (selectedId && gemma.all_views && gemma.all_views.length > 0) {
      const view = gemma.all_views.find(v => v.id === selectedId);
      if (view) {
        const viewOption = {
          value: view.id,
          label: getViewName(view),
          data: view
        };
        setSelectedView(viewOption);
        
        // Fetch the view data if not already loaded or if different view
        if (!gemma.get_view || gemma.get_view.id !== selectedId) {
          console.log('🔄 Fetching view data for:', selectedId);
          gemma.fetchView(selectedId);
        }
      }
    }
  }, [location.search, gemma.all_views]);

  // Helper function to get view name
  const getViewName = (view) => {
    return (
      view.properties?.find(
        (property) => property.propertyDefinitionRef === 'propid-70'
      )?.value || view.name || 'Unnamed View'
    );
  };

  // Handle view selection from dropdown
  const handleViewSelection = (selectedOption) => {
    if (selectedOption) {
      // Set loading state immediately when switching views
      setViewIsDoneLoading(false);
      setViewNodesData(null);
      setViewRelationsData(null);
      
      setSelectedView(selectedOption);
      
      // Update URL with selected view ID
      const newUrl = `/views?selected=${selectedOption.value}`;
      navigate(newUrl);
    }
  };

  // Create options for the dropdown
  const viewOptions = (gemma.all_views || []).map(view => ({
    value: view.id,
    label: getViewName(view),
    data: view
  }));

  // Process view data for rendering - using nested data directly
  useEffect(() => {
    if (!gemma.get_view) {
      setViewIsDoneLoading(false);
      return;
    }

    // Reset loading state
    setViewIsDoneLoading(false);
    
    console.log('🎯 Processing view data directly from API response');

    // Extract nodes and relationships directly from the view response
    const nodes = gemma.get_view.nodes || gemma.get_view.viewNodes || [];
    const relationships = gemma.get_view.connections || gemma.get_view.viewRelationships || [];

    console.log('🎯 Found', nodes.length, 'nodes and', relationships.length, 'relationships in view data');
    
    // Debug: Log first few nodes to understand structure
    if (nodes.length > 0) {
      console.log('🔍 First node structure:', JSON.stringify(nodes[0], null, 2));
      console.log('🔍 Node has elementRef:', !!nodes[0].elementRef);
      console.log('🔍 Node has referentieComponenten:', !!nodes[0].referentieComponenten, nodes[0].referentieComponenten);
      console.log('🔍 Node has style:', !!nodes[0].style, nodes[0].style);
    }

    // Set the data directly - no additional API calls needed
    setViewNodesData(nodes);
    setViewRelationsData(relationships);
    
    // Set loading complete
    setViewIsDoneLoading(true);
  }, [gemma.get_view]);

  // Render view when data is ready
  useEffect(() => {
    if (!gemma.get_view) return;
    if (!viewNodesData) return;
    if (!viewRelationsData) return;

    // Small delay to ensure DOM is ready
    const renderGraph = () => {
      console.log('🎯 Attempting to render graph...');
      
      // Create container in HTML
      const container = document.getElementById('graph-container');
      console.log('🎯 Container found:', !!container, container);
      
      if (!container) {
        console.log('⚠️ Container not found, retrying...');
        // Retry after a short delay
        setTimeout(renderGraph, 100);
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

      // Convert nodes function - enhanced to handle referentie componenten and styling
      const convertToViewNode = (node) => {
        // Helper function to get RGBA color string
        const getRGBAColor = (colorObj) => {
          if (!colorObj || typeof colorObj !== 'object') return null;
          const { r = 255, g = 255, b = 255, a = 1 } = colorObj;
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        };

        // Handle nodes without elementRef (including referentie componenten)
        if (!node.elementRef) {
          // Handle Label type nodes
          if (node.type === 'Label') {
            return {
              modelNodeId: node.identifier,
              viewNodeId: node.identifier || 'unknown',
              name: node.label,
              type: node.type?.toLowerCase() || 'label',
              x: node.position?.x || 0,
              y: node.position?.y || 0,
              width: node.position?.w || 120,
              height: node.position?.h || 30,
              parent: null,
              description: node.label,
              font: node.style?.font || null,
              elementRef: null,
            };
          }

          // Handle referentieComponenten - create multiple nodes
          if (node.referentieComponenten && Array.isArray(node.referentieComponenten)) {
            return node.referentieComponenten.map((refComponent) => {
              const uniqueId = `${node.id}_${refComponent}`;
              
              return {
                modelNodeId: uniqueId,
                viewNodeId: uniqueId,
                name: refComponent || 'Referentie Component',
                type: 'referentiecomponent',
                x: node.position?.x || 0,
                y: node.position?.y || 0,
                width: node.position?.w || 120,
                height: node.position?.h || 80,
                parent: node.id,
                description: `Referentie component: ${refComponent}`,
                elementRef: null,
                color: getRGBAColor(node.style?.fillColor) || '#e6f3ff',
                borderColor: getRGBAColor(node.style?.lineColor) || '#0066cc',
                font: node.style?.font ? {
                  name: node.style.font.name,
                  size: node.style.font.size,
                  color: getRGBAColor(node.style.color) || '#000000',
                } : null,
              };
            }).filter(Boolean);
          }

          // For debugging: don't skip nodes, create a basic node instead
          console.warn('⚠️ Creating basic node for unprocessed node:', node);
          return {
            modelNodeId: node.identifier || node.id || `unknown-${Date.now()}`,
            viewNodeId: node.identifier || node.id || `unknown-${Date.now()}`,
            name: node.name || node.label || 'Unknown Node',
            type: node.type?.toLowerCase() || 'unknown',
            x: node.position?.x || 0,
            y: node.position?.y || 0,
            width: node.position?.w || 120,
            height: node.position?.h || 80,
            parent: null,
            color: '#ffffff',
            borderColor: '#000000',
            description: 'Unprocessed node type',
            elementRef: null,
          };
        }

        // Handle regular nodes with elementRef
        return {
          modelNodeId: node.isChildNode ? node.identifier : node.elementRef,
          viewNodeId: node.identifier || 'unknown',
          name: node.name || 'Unknown',
          type: node.type?.toLowerCase() || 'dataobject',
          x: node.position?.x || 0,
          y: node.position?.y || 0,
          width: node.position?.w || 120,
          height: node.position?.h || 80,
          parent: null,
          // Enhanced styling from node.style
          color: getRGBAColor(node.style?.fillColor) || '#ffffff',
          borderColor: getRGBAColor(node.style?.lineColor) || '#000000',
          font: node.style?.font ? {
            name: node.style.font.name,
            size: node.style.font.size,
            color: getRGBAColor(node.style.color) || '#000000',
          } : null,
          description: node.description || null,
          elementRef: node.elementRef || null,
          onClick: node.elementRef ? () => {
            window.open(
              `https://www.gemmaonline.nl/wiki/GEMMA/${node.elementRef}`,
              '_blank'
            );
          } : null,
        };
      };

      // Convert relationships function - enhanced to handle various API formats
      const convertToViewRelationship = (relationship) => {
        // Debug log raw relationship data
        const converted = {
          modelRelationshipId: relationship.modelRelationshipId || relationship.relationshipRef || relationship.identifier || relationship.id,
          viewRelationshipId: relationship.viewRelationshipId || relationship.identifier || relationship.id,
          name: relationship.name || relationship.label || '',
          type: relationship.type || 'association',
          sourceId: relationship.sourceId || relationship.sourceElementRef || relationship.source || relationship.sourceViewNodeRef,
          targetId: relationship.targetId || relationship.targetElementRef || relationship.target || relationship.targetViewNodeRef,
        };
        return converted;
      };

      // Convert nodes for rendering - handle both single nodes and arrays (referentieComponenten)
      const viewNodes = (viewNodesData || [])
        .map(convertToViewNode)
        .filter(Boolean)
        .flat(); // Flatten arrays from referentieComponenten

      // Convert relationships for rendering - use already processed data
      const viewRelationships = (viewRelationsData || [])
        .map(convertToViewRelationship)
        .filter(Boolean);

      console.log('🎯 Rendering with nodes:', viewNodes.length, 'relationships:', viewRelationships.length);
      
      // Debug: Log node and relationship counts and structures
      console.log('🔍 Total nodes after conversion:', viewNodes.length);
      console.log('🔍 Total relationships:', viewRelationships.length);
      console.log('🔍 Node IDs:', viewNodes.map(n => ({ id: n.modelNodeId, viewId: n.viewNodeId, name: n.name })));
      console.log('🔍 Relationship source/targets:', viewRelationships.map(r => ({ 
        sourceId: r.sourceId, 
        targetId: r.targetId,
        name: r.name 
      })));
      
      // For now, let's try with ALL relationships to see what happens
      console.log('⚠️ Using ALL relationships without filtering to debug rendering issue');

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
          textWeight: 'normal',
          lineColor: 'black',
          lineWidth: 1,
          fillOpacity: 0.3,
          wordWrap: true,
          direction: 'TopToBottom',
          nestingMode: 'Nested',
          connectorLabelOrientation: 'Horizontal',
        })
      );

      // Set SVG viewBox with padding to prevent cut-off
      container.querySelectorAll(':scope > svg').forEach((node) => {
        const box = node.querySelector('g').getBBox();
        const padding = 20; // Add padding to prevent cut-off
        node.setAttribute('id', 'svg-container');
        node.setAttribute('viewBox', `${box.x - padding} ${box.y - padding} ${box.width + 2 * padding} ${box.height + 2 * padding}`);
        // Ensure minimum height
        node.style.minHeight = '400px';
      });

      // Always set loading done when we reach this point
      setViewIsDoneLoading(true);
      console.log('✅ Graph rendered successfully!');
    };

    // Start rendering process
    renderGraph();
  }, [viewNodesData, viewRelationsData]);

  // Helper function to download SVG
  const downloadSvg = () => {
    const svgElement = document.querySelector('#svg-container');
    if (!svgElement) return;

    // Get SVG content
    const svgContent = new XMLSerializer().serializeToString(svgElement);
    
    // Create download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemma-view-${selectedView?.value || 'unknown'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <AcContainer spacing='lg'>
      {/* View Selection Header - ALWAYS VISIBLE */}
      <div className='con-views-list-header'>
        <div>
          <h1>
            {gemma.get_view && selectedView ? getViewName(gemma.get_view) : 'GEMMA weergaven'}
          </h1>
          <p>
            {gemma.get_view && selectedView 
              ? gemma.get_view.documentation || 'Geselecteerde weergave wordt getoond'
              : 'Selecteer een weergave om deze te bekijken'
            }
          </p>
        </div>
        
        {/* View Selection Dropdown and Download Button */}
        <div className='con-views-dropdown-container'>
          <ReactSelect
            options={viewOptions}
            value={selectedView}
            onChange={handleViewSelection}
            placeholder="Selecteer een weergave..."
            isLoading={gemma.is_loading || (selectedView && !viewIsDoneLoading)}
            isDisabled={gemma.is_loading || viewOptions.length === 0}
            className="con-views-dropdown"
            classNamePrefix="con-views-dropdown"
            loadingMessage={() => "Schema wordt geladen..."}
          />
          
          {/* Download SVG Button - Next to dropdown */}
          {gemma.get_view && !gemma.get_viewError && (
            <PrimaryActionButton
              onClick={downloadSvg}
              disabled={!viewIsDoneLoading}
              data-tooltip-id={TOOLTIP_ID}
              data-tooltip-content="Download weergave als SVG"
              style={{ marginLeft: '1rem' }}
            >
              Download SVG
            </PrimaryActionButton>
          )}
        </div>
      </div>

      {/* Loading States */}
      {(gemma.is_loading || (selectedView && gemma.get_view && !viewIsDoneLoading)) && (
        <div className='con-views-loading'>
          <AcLoader />
          <p>
            {gemma.is_loading && !gemma.get_view ? 
              'Schema wordt geladen...' : 
              'Weergave wordt gerenderd...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {gemma.get_viewError && (
        <div className='con-views-error'>
          <h2>Weergave niet gevonden</h2>
          <p>De opgevraagde weergave kon niet worden gevonden of er was een fout bij het laden.</p>
          <p>Controleer de selectie en probeer het opnieuw.</p>
        </div>
      )}

      {/* View Content - Only show when fully loaded and rendered */}
      {gemma.get_view && !gemma.get_viewError && viewIsDoneLoading && viewNodesData && viewRelationsData && (
        <div className='con-views-graph-container' id='graph-container'></div>
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
import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate, useLocation } from 'react-router';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import { withStore } from '@stores';
import { PrimaryActionButton } from '@utrecht/component-library-react/dist/css-module';
import { AcLoader, ConDynamicSidenav } from '@components';
import { TOOLTIP_ID } from '@src/index.web';
import { VISUALS } from '@constants';
import ReactSelect from 'react-select';
import { dia, shapes } from 'jointjs';
import { ViewRenderer, ViewSettings } from '@conduction/archimate-diagram-engine';
import svgPanZoom from 'svg-pan-zoom';

/**
 * Beheer Views Component
 * Admin interface for viewing and managing AMEF views
 */
const ConBeheerViews = ({ store }) => {
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
      setSelectedView(selectedOption);
      
      // Update URL with selected view ID
      const newUrl = `/beheer/views?selected=${selectedOption.value}`;
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
    
    console.log('🎯 Beheer: Processing view data directly from API response');

    // Extract nodes and relationships directly from the view response
    const nodes = gemma.get_view.nodes || gemma.get_view.viewNodes || [];
    const relationships = gemma.get_view.connections || gemma.get_view.viewRelationships || [];

    console.log('🎯 Beheer: Found', nodes.length, 'nodes and', relationships.length, 'relationships in view data');

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
      console.log('🎯 Attempting to render beheer graph...');
      
      // Create container in HTML
      const container = document.getElementById('beheer-graph-container');
      console.log('🎯 Beheer Container found:', !!container, container);
      
      if (!container) {
        console.log('⚠️ Beheer Container not found, retrying...');
        // Retry after a short delay
        setTimeout(renderBeheerGraph, 100);
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
          modelRelationshipId: relationship.modelRelationshipId || relationship.relationshipRef || relationship.identifier,
          viewRelationshipId: relationship.viewRelationshipId || relationship.identifier,
          name: relationship.name || relationship.label || '',
          type: relationship.type || 'association',
          sourceId: relationship.sourceId || relationship.sourceElementRef || relationship.source,
          targetId: relationship.targetId || relationship.targetElementRef || relationship.target,
        };
      };

      // Convert nodes for rendering - use already processed data
      const viewNodes = (viewNodesData || [])
        .map(convertToViewNode)
        .filter(Boolean);

      // Convert relationships for rendering - use already processed data
      const viewRelationships = (viewRelationsData || [])
        .map(convertToViewRelationship)
        .filter(Boolean);

      console.log('🎯 Beheer rendering with nodes:', viewNodes.length, 'relationships:', viewRelationships.length);

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

      // Set SVG viewBox for beheer
      container.querySelectorAll(':scope > svg').forEach((node) => {
        const box = node.querySelector('g').getBBox();
        const padding = 20; // Add padding to prevent cut-off
        node.setAttribute('id', 'beheer-svg-container');
        node.setAttribute('viewBox', `${box.x - padding} ${box.y - padding} ${box.width + 2 * padding} ${box.height + 2 * padding}`);
        // Ensure minimum height
        node.style.minHeight = '400px';
      });

      // Always set loading done when we reach this point
      setViewIsDoneLoading(true);
      console.log('✅ Beheer Graph rendered successfully!');
    };

    // Start rendering process
    renderBeheerGraph();
  }, [viewNodesData, viewRelationsData]);

  // Helper function to download SVG (beheer version)
  const downloadBeheerSvg = () => {
    const svgElement = document.querySelector('#beheer-svg-container');
    if (!svgElement) return;

    // Get SVG content
    const svgContent = new XMLSerializer().serializeToString(svgElement);
    
    // Create download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemma-beheer-view-${selectedView?.value || 'unknown'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <AcFlex direction='row' gap='none'>
      {/* Admin Sidebar */}
      <ConDynamicSidenav />
      
      {/* Main Content */}
      <div className='con-beheer-views-content'>
        <AcContainer spacing='lg'>
          {/* View Selection Header */}
          <div className='con-beheer-views-header'>
            <div>
              <h1>
                {gemma.get_view && selectedView ? getViewName(gemma.get_view) : 'GEMMA weergaven beheer'}
              </h1>
              <p>
                {gemma.get_view && selectedView 
                  ? gemma.get_view.documentation || 'Geselecteerde weergave wordt getoond'
                  : 'Beheer en bekijk GEMMA weergaven'
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
                isLoading={gemma.is_loading}
                isDisabled={gemma.is_loading || viewOptions.length === 0}
                className="con-views-dropdown"
                classNamePrefix="con-views-dropdown"
              />
              
              {/* Download SVG Button - Next to dropdown */}
              {gemma.get_view && !gemma.get_viewError && (
                <PrimaryActionButton
                  onClick={downloadBeheerSvg}
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

          {/* Loading State */}
          {gemma.is_loading && !gemma.get_view && <AcLoader />}

          {/* Error State */}
          {gemma.get_viewError && (
            <div className='con-beheer-views-error'>
              <h2>Weergave niet gevonden</h2>
              <p>De opgevraagde weergave kon niet worden gevonden of er was een fout bij het laden.</p>
              <p>Controleer de selectie en probeer het opnieuw.</p>
            </div>
          )}

          {/* View Content */}
          {gemma.get_view && !gemma.get_viewError && (
            <>
              {/* Graph Container */}
              {viewNodesData && viewRelationsData && (
                <div className='con-beheer-views-graph-container' id='beheer-graph-container'></div>
              )}
              
              {/* Loading indicator for graph rendering */}
              {gemma.get_view && !viewIsDoneLoading && (
                <div className='con-beheer-views-graph-loading'>
                  <AcLoader />
                  <p>Weergave wordt geladen...</p>
                </div>
              )}
            </>
          )}

          {/* No Views Available */}
          {!gemma.is_loading && viewOptions.length === 0 && (
            <div className='con-beheer-views-no-data'>
              <h2>Geen weergaven beschikbaar</h2>
              <p>Er zijn momenteel geen GEMMA weergaven beschikbaar om te beheren.</p>
            </div>
          )}
        </AcContainer>
      </div>
    </AcFlex>
  );
};

export default withStore(observer(ConBeheerViews));
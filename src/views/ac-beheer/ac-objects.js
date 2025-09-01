import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { useNavigate, useParams } from 'react-router';
import ConBeheerPageWrapper from '@views/ac-beheer/core/components/con-beheer-page-wrapper';

const AcObjects = () => {
  const navigate = useNavigate();
  const { register, schema } = useParams();

  // Map objects route to beheer types. For vng-gemma/view we map to 'views'
  const configOverrides = useMemo(() => {
    if (register === 'vng-gemma' && schema === 'view') {
      return {
        registerSlug: 'vng-gemma',
        schemaSlug: 'view',
        routeType: 'view',
        paginationKey: 'view',
      };
    }
    if (register === 'vng-gemma' && schema === 'extendview') {
      return {
        registerSlug: 'vng-gemma',
        schemaSlug: 'extendview',
        routeType: 'extendview',
        paginationKey: 'extendview',
      };
    }
    return null;
  }, [register, schema]);

  useEffect(() => {
    if (!configOverrides) {
      // Fallback: redirect to beheer generic route if unmapped
      navigate('/beheer');
    }
  }, [configOverrides, navigate]);

  if (!configOverrides) return null;

  // Reuse the beheer generic page by passing the appropriate type and overriding the register/schema
  const type = configOverrides.routeType;
  return <ConBeheerPageWrapper type={type} configOverrides={configOverrides} />;
};

export default withStore(observer(AcObjects));

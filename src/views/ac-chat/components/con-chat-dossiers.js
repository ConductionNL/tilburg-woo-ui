/**
 * Chat Dossiers Component
 * 
 * Displays available dossiers (file/data collections) that can be queried
 * 
 * @category Components
 * @package TilburgWooUI
 */

import { observer } from 'mobx-react-lite';
import { AcCard, AcFlex } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';

/**
 * Chat Dossiers Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.store - Store object with chat and user
 * @returns {JSX.Element} Dossiers section
 */
const ConChatDossiers = observer(({ store }) => {
  const { chat } = store;
  const { dossiers, isLoading } = chat;

  return (
    <AcCard padding='md' className='con-chat-dossiers'>
      <AcFlex column spacing='md'>
        <Heading level={3}>Dossiers</Heading>
        
        <div className='con-chat-dossiers-list'>
          {isLoading ? (
            <p>Laden...</p>
          ) : dossiers.length === 0 ? (
            <div className='con-chat-dossiers-empty'>
              <VISUALS.FOLDER style={{ width: '32px', height: '32px', opacity: 0.3 }} />
              <p>Geen dossiers beschikbaar</p>
            </div>
          ) : (
            <ul className='con-chat-dossiers-items'>
              {dossiers.map((dossier) => (
                <li key={dossier.id} className='con-chat-dossier-item'>
                  <AcFlex alignItems='center' spacing='sm'>
                    <VISUALS.FOLDER style={{ width: '24px', height: '24px' }} />
                    <div>
                      <div className='con-chat-dossier-name'>{dossier.name}</div>
                      {dossier.description && (
                        <div className='con-chat-dossier-description'>
                          {dossier.description}
                        </div>
                      )}
                    </div>
                  </AcFlex>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className='con-chat-dossiers-info'>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #666)' }}>
            De chat heeft toegang tot data en bestanden in deze dossiers.
          </p>
        </div>
      </AcFlex>
    </AcCard>
  );
});

export default ConChatDossiers;


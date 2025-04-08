import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { Heading } from '@amsterdam/design-system-react';
import AcColumn from '@src/atoms/ac-column/ac-column';
import { AcContainer, AcSection } from '@src/atoms';
import { LABELS, VISUALS } from '@src/constants';
import { AcFormField, AcButton } from '@src/molecules';

const AcRegister = () => {
  const [kvkNumber, setKvkNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <Heading>{LABELS.REGISTER}</Heading>

          <AcColumn gap='sm'>
            <AcFormField
              label='kvk nummer'
              placeholder='12345678'
              value={kvkNumber}
              onChange={setKvkNumber}
            />
            <AcFormField
              label='naam'
              placeholder='John Doe'
              value={name}
              onChange={setName}
            />
            <AcFormField
              label='email adress'
              placeholder='john.doe@example.com'
              value={email}
              onChange={setEmail}
            />

            <AcButton style='button' icon={<VISUALS.ARROW_RIGHT />}>
              {LABELS.REGISTER}
            </AcButton>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcRegister));

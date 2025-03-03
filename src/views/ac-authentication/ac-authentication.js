import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import {
  Textbox,
  PrimaryActionButton,
} from '@utrecht/component-library-react/dist/css-module';
import { useNavigate } from 'react-router';

const AcAuthentication = () => {
  const navigate = useNavigate();

  const onSubmit = () => {
    navigate('/mijn-omgeving');
  };

  return (
    <form className='container container--compact' onSubmit={onSubmit}>
      <div className='ac-authentication-form'>
        <Textbox type='email' placeholder='email' />
        <Textbox type='password' placeholder='password' />
      </div>
      <PrimaryActionButton type='submit'>
        <VISUALS.ARROW_RIGHT />
        <span>Inloggen</span>
      </PrimaryActionButton>
    </form>
  );
};

export default withStore(observer(AcAuthentication));

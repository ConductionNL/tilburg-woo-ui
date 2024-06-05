import {
  FormField,
  FormLabel,
  Heading,
  Select,
  SelectOption,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgCheckbox } from '@molecules';
import { TilburgFlex } from '@atoms';
import { VISUALS } from '@constants';

const TilburgSearchFilters = () => {
  return (
    <TilburgFlex spacing={'sm'} column>
      <Heading level={2}>Filters</Heading>
      <FormField type='select'>
        <FormLabel>
          <Heading level={3}>Publicatiedatum</Heading>
        </FormLabel>
        <Select>
          <SelectOption>Selecteer jaartallen</SelectOption>
          <SelectOption>2024</SelectOption>
          <SelectOption>2023</SelectOption>
        </Select>
      </FormField>
      <FormField type='text'>
        <FormLabel>
          <Heading level={4}>Van (begindatum)</Heading>
        </FormLabel>
        <Textbox />
      </FormField>
      <FormField type='text'>
        <FormLabel>
          <Heading level={4}>Tot (einddatum)</Heading>
        </FormLabel>
        <Textbox />
      </FormField>
      <hr />
      <TilburgFlex spacing='xs' column>
        <TilburgFlex justifyContent={'between'} alignItems={'center'}>
          <Heading level={4}>Categorieën</Heading>
          <VISUALS.QUESTION_MARK />
        </TilburgFlex>
        <TilburgCheckbox label='Convenant' />
        <TilburgCheckbox label='Bestuursstuk' />
        <TilburgCheckbox label='Woo-verzoek' />
        <TilburgCheckbox label='Raadstuk' />
      </TilburgFlex>
      <hr />
      <TilburgFlex spacing='xs' column>
        <Heading level={4}>Onderwerpen</Heading>
        <TilburgCheckbox label='Campus Wijkevoort' />
        <TilburgCheckbox label='Evenementen in Tilburg' />
        <TilburgCheckbox label='Duurzaamheid' />
      </TilburgFlex>
    </TilburgFlex>
  );
};

export default TilburgSearchFilters;

import {
  Heading,
  Select,
  SelectOption,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgCheckbox } from '@molecules';
import { TilburgFlex } from '@atoms';
import { Separator } from '@utrecht/component-library-react';

const TilburgSearchFilters = () => {
  return (
    <TilburgFlex spacing={'xs'} column>
      <Heading level={2}>Filters</Heading>

      <Heading level={3}>Publicatiedatum</Heading>
      <Select>
        <SelectOption>Selecteer jaartallen</SelectOption>
        <SelectOption>2024</SelectOption>
        <SelectOption>2023</SelectOption>
      </Select>

      <Heading level={4}>Van (begindatum)</Heading>
      <Textbox />

      <Heading level={4}>Tot (einddatum)</Heading>
      <Textbox />

      <Separator />

      <Heading level={4}>Categorieën</Heading>
      <TilburgFlex spacing='xs' column>
        <TilburgCheckbox label='Convenant' />
        <TilburgCheckbox label='Bestuursstuk' />
        <TilburgCheckbox label='Woo-verzoek' />
        <TilburgCheckbox label='Raadstuk' />
      </TilburgFlex>

      <Separator />

      <Heading level={4}>Onderwerpen</Heading>
      <TilburgFlex spacing='xs' column>
        <TilburgCheckbox label='Campus Wijkevoort' />
        <TilburgCheckbox label='Evenementen in Tilburg' />
        <TilburgCheckbox label='Duurzaamheid' />
      </TilburgFlex>
    </TilburgFlex>
  );
};

export default TilburgSearchFilters;

import React from 'react';
import clsx from 'clsx';
import ReactSelect from 'react-select';
import { AcButton } from '@src/molecules';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Textbox,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@src/constants';

const ConKoppelingStageToevoegen = ({
  rows,
  addRow,
  removeRow,
  modulesOptions,
  loading,
  selectedAppAByRow,
  setSelectedAppAByRow,
  ownApp,
  typeOptions,
  typeByRow,
  setTypeByRow,
  selectedAppBByRow,
  setSelectedAppBByRow,
  beschrijvingByRow,
  setBeschrijvingByRow,
  directionOptions,
  directionByRow,
  setDirectionByRow,
  statusOptions,
  statusByRow,
  setStatusByRow,
  nameByRow,
  setNameByRow,
}) => {
  return (
    <div
      className='ac-register-form-section'
      role='group'
      aria-labelledby='koppeling-toevoegen-title'
    >
      <h2 id='koppeling-toevoegen-title' className='sr-only'>
        Toevoegen
      </h2>

      <TableContainer className='con-form-wizard-table-container'>
        <Table>
          <TableBody>
            {rows.map((rowId) => (
              <TableRow key={`row-${rowId}`}>
                <TableCell>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div>
                      <label className='utrecht-form-label'>Naam</label>
                      <Textbox
                        value={nameByRow[rowId] || ''}
                        onChange={(e) =>
                          setNameByRow((prev) => ({
                            ...prev,
                            [rowId]: e?.target?.value || '',
                          }))
                        }
                        placeholder='Naam van de koppeling'
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div>
                      <label className='utrecht-form-label'>Applicatie A</label>
                      <ReactSelect
                        isClearable
                        className={clsx(
                          'ac-beheer-select',
                          loading && 'ac-beheer-select--disabled'
                        )}
                        options={modulesOptions}
                        value={
                          selectedAppAByRow[rowId] != null
                            ? modulesOptions.find(
                                (o) => o.value === selectedAppAByRow[rowId]
                              ) || null
                            : ownApp || null
                        }
                        onChange={(opt) =>
                          setSelectedAppAByRow((prev) => ({
                            ...prev,
                            [rowId]: opt?.value,
                          }))
                        }
                        placeholder='Selecteer applicatie A'
                      />
                    </div>
                    <div>
                      <label className='utrecht-form-label'>Soort</label>
                      <ReactSelect
                        className={clsx(
                          'ac-beheer-select',
                          loading && 'ac-beheer-select--disabled'
                        )}
                        options={typeOptions}
                        value={
                          typeByRow[rowId]
                            ? typeOptions.find((o) => o.value === typeByRow[rowId])
                            : null
                        }
                        onChange={(opt) =>
                          setTypeByRow((prev) => ({
                            ...prev,
                            [rowId]: opt?.value,
                          }))
                        }
                        placeholder='Soort'
                      />
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div>
                      <label className='utrecht-form-label'>Applicatie B</label>
                      <ReactSelect
                        className={clsx(
                          'ac-beheer-select',
                          loading && 'ac-beheer-select--disabled'
                        )}
                        isClearable
                        options={modulesOptions}
                        value={
                          selectedAppBByRow[rowId] != null
                            ? modulesOptions.find(
                                (o) => o.value === selectedAppBByRow[rowId]
                              ) || null
                            : null
                        }
                        onChange={(opt) =>
                          setSelectedAppBByRow((prev) => ({
                            ...prev,
                            [rowId]: opt?.value,
                          }))
                        }
                        placeholder='Selecteer applicatie B'
                      />
                    </div>
                    <div>
                      <label className='utrecht-form-label'>Beschrijving</label>
                      <Textbox
                        value={beschrijvingByRow[rowId] || ''}
                        onChange={(e) =>
                          setBeschrijvingByRow((prev) => ({
                            ...prev,
                            [rowId]: e?.target?.value || '',
                          }))
                        }
                        placeholder='Korte beschrijving'
                      />
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div>
                      <label className='utrecht-form-label'>Richting</label>
                      <ReactSelect
                        className={clsx(
                          'ac-beheer-select',
                          loading && 'ac-beheer-select--disabled'
                        )}
                        options={directionOptions}
                        value={
                          directionByRow[rowId]
                            ? directionOptions.find(
                                (o) => o.value === directionByRow[rowId]
                              )
                            : null
                        }
                        onChange={(opt) =>
                          setDirectionByRow((prev) => ({
                            ...prev,
                            [rowId]: opt?.value,
                          }))
                        }
                        placeholder='Richting'
                      />
                    </div>
                    <div>
                      <label className='utrecht-form-label'>Status</label>
                      <ReactSelect
                        className={clsx(
                          'ac-beheer-select',
                          loading && 'ac-beheer-select--disabled'
                        )}
                        options={statusOptions}
                        value={
                          statusByRow[rowId]
                            ? statusOptions.find(
                                (o) => o.value === statusByRow[rowId]
                              )
                            : null
                        }
                        onChange={(opt) =>
                          setStatusByRow((prev) => ({
                            ...prev,
                            [rowId]: opt?.value,
                          }))
                        }
                        placeholder='Status'
                      />
                    </div>
                  </div>
                </TableCell>

                <TableCell style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                  <AcButton
                    style='button'
                    buttonType='secondary'
                    onClick={() => removeRow(rowId)}
                    disabled={rows.length === 1}
                    icon={<VISUALS.CLOSE />}
                  ></AcButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div style={{ marginTop: '1rem' }}>
        <AcButton style='button' onClick={addRow}>
          Rij toevoegen
        </AcButton>
      </div>
    </div>
  );
};

export default ConKoppelingStageToevoegen;

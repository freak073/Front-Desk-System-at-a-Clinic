import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MonthlyCalendar from '../MonthlyCalendar';

const appt = (id: number, date: string) =>
  ({
    id,
    patientId: 1,
    doctorId: 1,
    appointmentDatetime: date,
    status: 'booked',
    createdAt: date,
    updatedAt: date,
    patient: { name: `Patient ${id}` },
  } as any);

describe('MonthlyCalendar', () => {
  it('groups and displays appointments per day and triggers select', async () => {
    const onSelect = jest.fn();
    const base = '2025-08-10T';
    const appointments = [
      appt(1, base + '09:00:00.000Z'),
      appt(2, base + '10:00:00.000Z'),
      appt(3, base + '11:00:00.000Z'),
      appt(4, base + '12:00:00.000Z'),
    ];

    render(
      <MonthlyCalendar
        appointments={appointments}
        month={7}
        year={2025}
        onSelectAppointment={onSelect}
      />
    );

    const dayButton = screen.getByRole('button', {
      name: /Day 10 with 4 appointments/i,
    });
    fireEvent.click(dayButton);

    const appointmentList = await screen.findByLabelText(
      /Appointments for day 10/i
    );
  const buttons = within(appointmentList).getAllByRole('button');
  expect(buttons.length).toBeGreaterThan(0);
  fireEvent.click(buttons[0]);

  expect(onSelect).toHaveBeenCalled();
  });

  it('navigates between months with prev/next buttons', () => {
    render(
      <MonthlyCalendar
        appointments={[]}
        month={0}
        year={2025}
      />
    );
    const label = screen.getByLabelText('Current month label');
    expect(label.textContent).toMatch(/January 2025/);
    const next = screen.getByRole('button', { name: /Next month/i });
    const prev = screen.getByRole('button', { name: /Previous month/i });
    // Go forward
    fireEvent.click(next);
    expect(label.textContent).toMatch(/February 2025/);
    // Go back
    fireEvent.click(prev);
    expect(label.textContent).toMatch(/January 2025/);
    // Go back from January to previous year December
    fireEvent.click(prev);
    expect(label.textContent).toMatch(/December 2024/);
  });
});

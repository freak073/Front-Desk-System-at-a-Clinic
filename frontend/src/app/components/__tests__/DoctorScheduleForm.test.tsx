import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DoctorScheduleForm from '../DoctorScheduleForm';

const doctor: any = { id:1, name:'Dr Test', specialization:'Spec', gender:'male', location:'Loc', status:'available', createdAt:'', updatedAt:'' };

describe('DoctorScheduleForm', () => {
  it('marks form dirty when schedule changed and calls onSave', async () => {
    const onSave = jest.fn();
    const onDirty = jest.fn();
    render(<DoctorScheduleForm doctor={doctor} onSave={onSave} onCancel={()=>{}} onDirtyChange={onDirty} />);
    const monStart = screen.getByLabelText('Monday start');
    fireEvent.change(monStart, { target: { value: '09:00' } });
    expect(onDirty).toHaveBeenLastCalledWith(true);
    const btn = screen.getByRole('button', { name: /save/i });
  fireEvent.click(btn);
  await waitFor(()=> expect(onSave).toHaveBeenCalled());
  });
});

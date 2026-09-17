import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { InternationalPhoneInput } from './international-phone-input';

describe('InternationalPhoneInput', () => {
  it('shows a country selector and emits an international phone number', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    function Harness() {
      const [value, setValue] = React.useState('');
      return (
        <InternationalPhoneInput
          onChange={(nextValue) => {
            setValue(nextValue);
            onValueChange(nextValue);
          }}
          value={value}
        />
      );
    }

    render(<Harness />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: /country/i }),
      'EG',
    );
    await user.type(screen.getByRole('textbox'), '1012345678');

    expect(onValueChange).toHaveBeenLastCalledWith('+201012345678');
    expect(screen.getByRole('combobox')).toHaveValue('EG');
  });
});

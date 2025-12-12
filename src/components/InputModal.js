/**
 * Input modal component - handles text input
 */

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

const h = React.createElement;

const InputModal = ({ prompt, value, onChange, onSubmit }) => {
  const handleSubmit = (inputValue) => {
    onSubmit(inputValue);
  };

  return h(Box, {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'yellow',
      paddingX: 2,
      paddingY: 1
    },
    h(Text, { color: 'yellow', bold: true }, prompt),
    h(Box, { marginTop: 1 },
      h(Text, { color: 'cyan' }, '> '),
      h(TextInput, {
        value,
        onChange,
        onSubmit: handleSubmit
      })
    ),
    h(Box, { marginTop: 1 },
      h(Text, { color: 'gray' }, '(Press Enter to confirm, Escape to cancel)')
    )
  );
};

export default InputModal;

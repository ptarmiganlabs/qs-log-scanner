/**
 * Search terms view component - displays active search terms
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

const SearchTermsView = ({ searchTerms }) => {
  const content = searchTerms.length === 0
    ? [h(Text, { key: 'empty', color: 'yellow' }, 'No search terms configured')]
    : [
        ...searchTerms.map((term, index) =>
          h(Box, { key: index },
            h(Text, { color: 'green' }, '• '),
            h(Text, null, term)
          )
        ),
        h(Box, { key: 'total', marginTop: 1 },
          h(Text, { color: 'gray' }, `Total: ${searchTerms.length} search term(s)`)
        )
      ];

  return h(Box, { flexDirection: 'column', padding: 1 },
    h(Text, { bold: true, color: 'cyan' }, '═══ Active Search Terms ═══'),
    h(Box, { marginTop: 1 }),
    ...content,
    h(Box, { marginTop: 1 },
      h(Text, { color: 'gray' }, 'Press [s] to return to main view')
    )
  );
};

export default SearchTermsView;

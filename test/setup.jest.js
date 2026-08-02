/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

require('@testing-library/jest-dom/extend-expect');

const { configure } = require('@testing-library/react');

configure({ testIdAttribute: 'data-test-subj' });

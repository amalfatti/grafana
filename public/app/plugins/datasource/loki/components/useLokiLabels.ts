import { useState, useEffect } from 'react';
import LokiLanguageProvider from 'app/plugins/datasource/loki/language_provider';

/**
 *
 * @param languageProvider
 * @param languageProviderInitialised
 * @param activeOption rc-cascader provided option used to fetch option's values that hasn't been loaded yet
 *
 * @description Fetches missing labels and enables labels refresh
 */
export const useLokiLabels = (
  languageProvider: LokiLanguageProvider,
  languageProviderInitialised: boolean,
  activeOption: any[]
) => {
  // State
  const [logLabelOptions, setLogLabelOptions] = useState([]);
  const [shouldTryRefreshLabels, setRefreshLabels] = useState(false);

  // Async
  const fetchOptionValues = async option => {
    await languageProvider.fetchLabelValues(option);
    setLogLabelOptions(languageProvider.logLabelOptions);
  };

  const tryLabelsRefresh = async () => {
    await languageProvider.refreshLogLabels();
    setRefreshLabels(false);
    setLogLabelOptions(languageProvider.logLabelOptions);
  };

  // Effects

  // This effect performs loading of options that hasn't been loaded yet
  // It's a subject of activeOption state change only. This is because of specific behavior or rc-cascader
  // https://github.com/react-component/cascader/blob/master/src/Cascader.jsx#L165
  useEffect(() => {
    if (!languageProviderInitialised) {
      return;
    }
    const targetOption = activeOption[activeOption.length - 1];

    if (!targetOption) {
      return;
    }

    const nextOptions = logLabelOptions.map(option => {
      if (option.value === targetOption.value) {
        return {
          ...option,
          loading: true,
        };
      }
      return option;
    });
    setLogLabelOptions(nextOptions); // to set loading
    fetchOptionValues(targetOption.value);
  }, [activeOption]);

  // This effect is performed on shouldTryRefreshLabels state change only.
  // Since shouldTryRefreshLabels is reset AFTER the labels are refreshed we are secured in case of trying to refresh
  // when previous refresh hasn't finished yet
  useEffect(() => {
    if (shouldTryRefreshLabels) {
      tryLabelsRefresh();
    }
  }, [shouldTryRefreshLabels]);

  return {
    logLabelOptions,
    setLogLabelOptions,
    refreshLabels: () => setRefreshLabels(true),
  };
};

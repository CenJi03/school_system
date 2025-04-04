// src/hooks/usePagination.js

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const usePagination = (fetchData, initialParams = {}, options = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    pageParamName = 'page',
    pageSizeParamName = 'page_size',
    defaultPage = 1,
    defaultPageSize = 10,
    preserveParams = true
  } = options;
  
  // Get initial page and pageSize from URL params or defaults
  const initialPage = parseInt(searchParams.get(pageParamName)) || defaultPage;
  const initialPageSize = parseInt(searchParams.get(pageSizeParamName)) || defaultPageSize;
  
  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to load data with current pagination
  const loadData = useCallback(async (pageToLoad = page, pageSizeToLoad = pageSize) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchData({
        [pageParamName]: pageToLoad,
        [pageSizeParamName]: pageSizeToLoad,
        ...initialParams
      });
      
      setData(response.results || response.data || response);
      setTotalItems(response.count || response.total || response.results?.length || 0);
      
      // Update URL params
      const updatedParams = new URLSearchParams(
        preserveParams ? searchParams : {}
      );
      updatedParams.set(pageParamName, pageToLoad);
      updatedParams.set(pageSizeParamName, pageSizeToLoad);
      setSearchParams(updatedParams);
      
      return response;
    } catch (err) {
      setError(err);
      console.error('Error fetching paginated data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchData, initialParams, page, pageSize, pageParamName, pageSizeParamName, preserveParams, searchParams, setSearchParams]);
  
  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData(page, pageSize);
  }, [loadData, page, pageSize]);
  
  // Handle page change
  const goToPage = (newPage) => {
    setPage(newPage);
  };
  
  // Handle page size change
  const setItemsPerPage = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return {
    data,
    totalItems,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    goToPage,
    setItemsPerPage,
    reload: () => loadData(page, pageSize),
    refresh: () => loadData(1, pageSize)
  };
};

export default usePagination;
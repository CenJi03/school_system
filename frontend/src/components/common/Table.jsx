// src/components/common/Table.jsx

import React from 'react';
import PropTypes from 'prop-types';

const Table = ({
  columns,
  data,
  onRowClick,
  keyField = 'id',
  striped = true,
  hoverable = true,
  bordered = true,
  compact = false,
  responsive = true,
  className = '',
  ...props
}) => {
  const baseClass = 'o-table';
  const stripedClass = striped ? `${baseClass}--striped` : '';
  const hoverableClass = hoverable ? `${baseClass}--hover` : '';
  const borderedClass = bordered ? `${baseClass}--bordered` : '';
  const compactClass = compact ? `${baseClass}--compact` : '';
  const responsiveClass = responsive ? `${baseClass}--responsive` : '';
  
  const tableClasses = [
    baseClass,
    stripedClass,
    hoverableClass,
    borderedClass,
    compactClass,
    className
  ].filter(Boolean).join(' ');
  
  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };
  
  const renderCell = (column, item) => {
    if (column.render) {
      return column.render(item);
    }
    
    if (column.field) {
      return item[column.field];
    }
    
    return null;
  };
  
  const wrapperClass = responsive ? `${baseClass}-responsive-wrapper` : '';
  
  return (
    <div className={wrapperClass}>
      <table className={tableClasses} {...props}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className={column.className}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr 
              key={item[keyField]} 
              onClick={() => handleRowClick(item)}
              className={onRowClick ? `${baseClass}__row--clickable` : ''}
            >
              {columns.map((column, index) => (
                <td key={index} className={column.cellClassName}>
                  {renderCell(column, item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.node.isRequired,
      field: PropTypes.string,
      render: PropTypes.func,
      className: PropTypes.string,
      cellClassName: PropTypes.string
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  onRowClick: PropTypes.func,
  keyField: PropTypes.string,
  striped: PropTypes.bool,
  hoverable: PropTypes.bool,
  bordered: PropTypes.bool,
  compact: PropTypes.bool,
  responsive: PropTypes.bool,
  className: PropTypes.string
};

export default Table;
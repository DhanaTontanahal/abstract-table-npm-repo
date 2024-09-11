import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFileCsv, faEye } from "@fortawesome/free-solid-svg-icons";
import Modal from "react-modal";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./AbstractTable.css";

const AbstractTable = ({ columns, data }) => {
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((col) => col.accessor)
  );
  const [orderedColumns, setOrderedColumns] = useState(columns);

  const itemsPerPage = 10;

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (
          (a[sortConfig.key] || "").toString() <
          (b[sortConfig.key] || "").toString()
        ) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (
          (a[sortConfig.key] || "").toString() >
          (b[sortConfig.key] || "").toString()
        ) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = sortedData
    .filter((item) =>
      columns.some((column) =>
        (item[column.accessor] || "")
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    )
    .filter((item) =>
      Object.keys(filters).every((key) =>
        (item[key] || "")
          .toString()
          .toLowerCase()
          .includes(filters[key].toLowerCase())
      )
    );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to the first page on search
  };

  const handleFilterChange = (column, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [column]: value,
    }));
    setCurrentPage(1); // Reset to the first page on filter change
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const handleColumnVisibilityChange = (column) => {
    setVisibleColumns((prevColumns) =>
      prevColumns.includes(column)
        ? prevColumns.filter((col) => col !== column)
        : [...prevColumns, column]
    );
  };

  const exportToCSV = () => {
    const headers = orderedColumns
      .filter((col) => visibleColumns.includes(col.accessor))
      .map((col) => col.Header)
      .join(",");
    const rows = data.map((row) =>
      orderedColumns
        .filter((col) => visibleColumns.includes(col.accessor))
        .map((col) => (row[col.accessor] || "").toString().replace(/"/g, '""'))
        .join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedColumns = Array.from(orderedColumns);
    const [removed] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, removed);

    setOrderedColumns(reorderedColumns);
  };

  return (
    <div className="abstract-table-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <div className="record-count">Total Records: {filteredData.length}</div>
        <button onClick={toggleFilters} className="filter-button">
          <FontAwesomeIcon icon={faFilter} />
        </button>
        <button onClick={toggleModal} className="columns-button">
          <FontAwesomeIcon icon={faEye} /> Columns
        </button>
        <button onClick={exportToCSV} className="export-button">
          <FontAwesomeIcon icon={faFileCsv} /> Export CSV
        </button>
      </div>
      <table className="abstract-table">
        <thead>
          <tr>
            {orderedColumns
              .filter((column) => visibleColumns.includes(column.accessor))
              .map((column) => (
                <th
                  key={column.accessor}
                  onClick={() => requestSort(column.accessor)}
                  className={
                    sortConfig.key === column.accessor
                      ? sortConfig.direction
                      : ""
                  }
                >
                  {column.Header}
                </th>
              ))}
          </tr>
          {showFilters && (
            <tr>
              {orderedColumns
                .filter((column) => visibleColumns.includes(column.accessor))
                .map((column) => (
                  <th key={`${column.accessor}-filter`}>
                    <input
                      type="text"
                      placeholder={`Filter ${column.Header}`}
                      value={filters[column.accessor] || ""}
                      onChange={(e) =>
                        handleFilterChange(column.accessor, e.target.value)
                      }
                      className="filter-input"
                    />
                  </th>
                ))}
            </tr>
          )}
        </thead>
        <tbody>
          {paginatedData.map((item, index) => (
            <tr key={index}>
              {orderedColumns
                .filter((column) => visibleColumns.includes(column.accessor))
                .map((column) => (
                  <td key={column.accessor}>
                    {typeof column.accessor === "function"
                      ? column.accessor(item)
                      : (item[column.accessor] || "").toString()}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`pagination-button ${
              currentPage === i + 1 ? "active" : ""
            }`}
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="record-count">Total Records: {filteredData.length}</div>

      <Modal
        isOpen={showModal}
        onRequestClose={toggleModal}
        contentLabel="Column Visibility"
      >
        <h2>Toggle Column Visibility</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="columns">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {orderedColumns.map((column, index) => (
                  <Draggable
                    key={column.accessor}
                    draggableId={column.accessor}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="modal-column-toggle"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column.accessor)}
                          onChange={() =>
                            handleColumnVisibilityChange(column.accessor)
                          }
                        />
                        <label>{column.Header}</label>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <button onClick={toggleModal} className="close-modal-button">
          Close
        </button>
      </Modal>
    </div>
  );
};

export default AbstractTable;

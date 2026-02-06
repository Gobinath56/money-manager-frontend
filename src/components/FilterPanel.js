import React, { useState } from "react";

function FilterPanel({ onFilter, onReset }) {
  const [division, setDivision] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleApply = () => {
    onFilter({
      division: division || null,
      category: category || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });
  };

  const handleReset = () => {
    setDivision("");
    setCategory("");
    setStartDate("");
    setEndDate("");
    onReset();
  };

  return (
    <div className="space-y-6">
      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Division */}
        <select
          value={division}
          onChange={(e) => setDivision(e.target.value)}
          className="input-style"
        >
          <option value="">All Divisions</option>
          <option value="PERSONAL">Personal</option>
          <option value="OFFICE">Office</option>
        </select>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input-style"
        >
          <option value="">All Categories</option>
          <option value="FUEL">Fuel</option>
          <option value="FOOD">Food</option>
          <option value="MOVIE">Movie</option>
          <option value="LOAN">Loan</option>
          <option value="MEDICAL">Medical</option>
          <option value="SALARY">Salary</option>
          <option value="FREELANCE">Freelance</option>
          <option value="INVESTMENT">Investment</option>
          <option value="OTHER">Other</option>
        </select>

        {/* Start Date */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input-style"
        />

        {/* End Date */}
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="input-style"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={handleReset} className="btn-outline">
          Reset
        </button>

        <button onClick={handleApply} className="btn-primary">
          Apply Filter
        </button>
      </div>
    </div>
  );
}

export default FilterPanel;

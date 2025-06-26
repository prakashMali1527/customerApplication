import { useState, useEffect, useRef } from 'react'

interface Person {
  id: string;
  name: string;
}

interface Column {
  id: string;
  title: string;
  people: Person[];
  dayNumber?: number;
}

// Local storage keys
const STORAGE_KEY = 'customer-management-app-data';
const COLLAPSED_COLUMNS_KEY = 'customer-management-collapsed-columns';

function App() {
  const [newPersonName, setNewPersonName] = useState('');
  const [newDayNumber, setNewDayNumber] = useState<number | ''>('');
  const [showDayInput, setShowDayInput] = useState(false);
  const [columns, setColumns] = useState<Column[]>(() => {
    // Try to load data from localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }
    
    // Default initial data if nothing is saved
    return [
      {
        id: 'customers',
        title: 'Customers',
        people: [],
      },
    ];
  });
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editDayNumber, setEditDayNumber] = useState<number | ''>('');
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [collapsedColumns, setCollapsedColumns] = useState<{[key: string]: boolean}>(() => {
    // Try to load collapsed state from localStorage
    const savedState = localStorage.getItem(COLLAPSED_COLUMNS_KEY);
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error('Failed to parse saved collapsed state:', e);
      }
    }
    return {};
  });
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);

  // Save data to localStorage whenever columns change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);
  
  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(COLLAPSED_COLUMNS_KEY, JSON.stringify(collapsedColumns));
  }, [collapsedColumns]);

  // Update existing columns to new format and sort people alphabetically
  useEffect(() => {
    setColumns(prevColumns => 
      prevColumns.map(col => {
        // Update column format if needed
        if (col.id !== 'customers' && col.dayNumber) {
          return {
            ...col,
            title: `#${col.dayNumber} Day`,
            // Sort people alphabetically
            people: [...col.people].sort((a, b) => a.name.localeCompare(b.name))
          };
        }
        // Sort people alphabetically
        return {
          ...col,
          people: [...col.people].sort((a, b) => a.name.localeCompare(b.name))
        };
      })
    );
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        const currentDropdownRef = dropdownRefs.current[activeDropdown];
        if (
          currentDropdownRef && 
          !currentDropdownRef.contains(event.target as Node)
        ) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Force a re-render when the dropdown is opened
  useEffect(() => {
    if (activeDropdown !== null) {
      // Force re-render to ensure all unassigned customers are shown
      setColumns(prevColumns => [...prevColumns]);
    }
  }, [activeDropdown]);

  const addPerson = () => {
    if (newPersonName.trim() === '') return;
    
    // Check if a person with this name already exists
    const isDuplicate = columns[0].people.some(p => 
      p.name.toLowerCase() === newPersonName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      // Find the duplicate person
      const duplicatePerson = columns[0].people.find(p => 
        p.name.toLowerCase() === newPersonName.trim().toLowerCase()
      );
      
      if (duplicatePerson) {
        // Highlight the duplicate person
        setHighlightedPersonId(duplicatePerson.id);
        
        // Remove highlight after 1 second
        setTimeout(() => {
          setHighlightedPersonId(null);
        }, 1000);
      }
      
      return; // Don't add the duplicate person
    }
    
    // Add the new person
    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name: newPersonName.trim()
    };
    
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      newColumns[0] = {
        ...newColumns[0],
        people: [...newColumns[0].people, newPerson]
      };
      return newColumns;
    });
    
    setNewPersonName('');
  };

  const addColumn = () => {
    if (newDayNumber === '') {
      // Default behavior - use next sequential number
      const maxDayNumber = Math.max(
        0,
        ...columns
          .filter(col => col.id !== 'customers')
          .map(col => col.dayNumber ?? 0)
      );
      const nextDayNumber = maxDayNumber + 1;
      
      const newColumn: Column = {
        id: `day-${nextDayNumber}`,
        title: `#${nextDayNumber} Day`,
        people: [],
        dayNumber: nextDayNumber,
      };
      
      setColumns(prevColumns => [...prevColumns, newColumn]);
    } else {
      // Custom day number
      const dayNum = Number(newDayNumber);
      
      const newColumn: Column = {
        id: `day-${dayNum}`,
        title: `#${dayNum} Day`,
        people: [],
        dayNumber: dayNum,
      };
      
      setColumns(prevColumns => {
        // Sort columns by day number after adding new one
        const newColumns = [...prevColumns, newColumn];
        return [
          newColumns[0], // Keep People column first
          ...newColumns
            .slice(1)
            .sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0))
        ];
      });
      
      setNewDayNumber('');
      setShowDayInput(false);
    }
  };

  const removeColumn = (columnId: string) => {
    setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId));
  };

  const toggleDropdown = (columnId: string) => {
    console.log('Toggling dropdown for column:', columnId);
    console.log('Current active dropdown:', activeDropdown);
    
    // Get unassigned customers before setting the active dropdown
    const unassigned = getUnassignedPeople();
    console.log('Unassigned customers at toggle:', unassigned);
    
    // Toggle the dropdown
    setActiveDropdown(activeDropdown === columnId ? null : columnId);
    
    // Add or remove active class from dropdown container
    setTimeout(() => {
      const dropdownContainer = document.querySelector(`.column[data-column-id="${columnId}"] .dropdown`);
      if (dropdownContainer) {
        if (activeDropdown === columnId) {
          dropdownContainer.classList.remove('active-dropdown');
        } else {
          dropdownContainer.classList.add('active-dropdown');
        }
      }
    }, 0);
  };

  const addPersonToColumn = (columnId: string, person: Person) => {
    setColumns(prevColumns => {
      // First, remove the person from any other day columns
      const updatedColumns = prevColumns.map(col => {
        if (col.id !== 'customers' && col.id !== columnId) {
          return {
            ...col,
            people: col.people.filter(p => p.id !== person.id),
          };
        }
        return col;
      });
      
      // Then add the person to the target column
      return updatedColumns.map(col => {
        if (col.id === columnId) {
          // Check if person already exists in this column
          if (!col.people.some(p => p.id === person.id)) {
            return {
              ...col,
              people: [...col.people, person].sort((a, b) => a.name.localeCompare(b.name)),
            };
          }
        }
        return col;
      });
    });
    
    // Close the dropdown after adding
    setActiveDropdown(null);
    
    // Force a re-render to update the available customers
    setTimeout(() => {
      setColumns(prevColumns => [...prevColumns]);
    }, 0);
  };

  const removePersonFromColumn = (columnId: string, personId: string) => {
    setColumns(prevColumns => 
      prevColumns.map(col => {
        if (col.id === columnId) {
          return {
            ...col,
            people: col.people.filter(p => p.id !== personId),
          };
        }
        return col;
      })
    );
  };

  // Get people who are not yet assigned to any day column
  const getUnassignedPeople = () => {
    // Get all people from the main list
    const allPeople = [...columns[0].people]; // Create a new array to avoid reference issues
    
    // Get IDs of people who are in any day column
    const assignedPeopleIds = new Set();
    columns.forEach(col => {
      if (col.id !== 'customers') {
        col.people.forEach(person => {
          assignedPeopleIds.add(person.id);
        });
      }
    });
    
    // Return people who are not in any day column
    const unassigned = allPeople.filter(p => !assignedPeopleIds.has(p.id));
    console.log('Unassigned people:', unassigned, 'Total people:', allPeople.length, 'Assigned:', assignedPeopleIds.size);
    return unassigned;
  };

  // Find which day column a person is assigned to
  const getPersonDayColumn = (personId: string) => {
    const dayColumn = columns.find(col => 
      col.id !== 'customers' && col.people.some(p => p.id === personId)
    );
    return dayColumn;
  };

  const printAll = () => {
    const content = generatePrintContent();
    printData(content);
    setShowPrintOptions(false);
  };
  
  const printColumn = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      const content = generatePrintContent([columns[0], column]);
      printData(content);
    }
    setShowPrintOptions(false);
  };

  const generatePrintContent = (columnsToRender = columns) => {
    const date = new Date().toLocaleString();
    
    // Start with the HTML structure
    let content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Management - Print</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }
          .print-header h1 {
            margin: 0;
            color: #4a6da7;
          }
          .print-header p {
            margin: 5px 0 0;
            color: #777;
            font-size: 0.9em;
          }
          .columns-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }
          .column {
            flex: 1;
            min-width: 250px;
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .column-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .column-header h2 {
            margin: 0;
            font-size: 1.3em;
            color: #4a6da7;
          }
          .people-count {
            background-color: #eee;
            color: #555;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
          }
          .person-item {
            padding: 8px 10px;
            margin-bottom: 8px;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .day-assignment {
            font-size: 0.8em;
            color: #555;
            background-color: #eee;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 8px;
          }
          @media print {
            body {
              padding: 0;
            }
            .column {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Customer Management</h1>
          <p>Generated on ${date}</p>
        </div>
        <div class="columns-container">
    `;
    
    // Add each column
    columnsToRender.forEach(column => {
      content += `
        <div class="column">
          <div class="column-header">
            <h2>${column.title}</h2>
            <span class="people-count">${column.people.length}</span>
          </div>
      `;
      
      // Add people in the column
      if (column.id === 'customers') {
        // For the main Customers column, show day assignments
        column.people.forEach(person => {
          const dayColumn = getPersonDayColumn(person.id);
          content += `
            <div class="person-item">
              ${person.name}
              ${dayColumn ? `<span class="day-assignment">${dayColumn.title}</span>` : ''}
            </div>
          `;
        });
      } else {
        // For day columns, just show people names
        column.people.forEach(person => {
          content += `<div class="person-item">${person.name}</div>`;
        });
      }
      
      content += `</div>`;
    });
    
    // Close HTML structure
    content += `
        </div>
      </body>
      </html>
    `;
    
    return content;
  };

  const printData = (content: string) => {
    // Create or use existing iframe
    let printFrame = printFrameRef.current;
    
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      document.body.appendChild(printFrame);
      printFrameRef.current = printFrame;
    }
    
    // Write content to iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(content);
      frameDoc.close();
      
      // Wait for content to load before printing
      setTimeout(() => {
        if (printFrame?.contentWindow) {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        }
      }, 500);
    }
  };

  const startEditingDay = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      setEditingColumnId(columnId);
      setEditDayNumber(column.dayNumber || 1);
    }
  };
  
  const saveEditedDay = () => {
    if (editingColumnId && editDayNumber !== '') {
      const dayNum = Number(editDayNumber);
      
      setColumns(prevColumns => {
        // Update the column with new day number
        const updatedColumns = prevColumns.map(col => {
          if (col.id === editingColumnId) {
            return {
              ...col,
              title: `#${dayNum} Day`,
              dayNumber: dayNum,
              id: `day-${dayNum}`, // Update ID to match new day number
            };
          }
          return col;
        });
        
        // Sort columns by day number
        return [
          updatedColumns[0], // Keep People column first
          ...updatedColumns
            .slice(1)
            .sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0))
        ];
      });
      
      setEditingColumnId(null);
      setEditDayNumber('');
    }
  };
  
  const cancelEditingDay = () => {
    setEditingColumnId(null);
    setEditDayNumber('');
  };

  const setDropdownRef = (element: HTMLDivElement | null, columnId: string) => {
    dropdownRefs.current[columnId] = element;
  };

  // Toggle column collapse state
  const toggleColumnCollapse = (columnId: string) => {
    // Get the column
    const column = columns.find(col => col.id === columnId);
    
    // If column has no customers, show dropdown message
    if (column && column.people.length === 0) {
      // Create a temporary dropdown element
      const button = document.querySelector(`.column[data-column-id="${columnId}"] .collapse-column-btn`);
      
      if (button) {
        // Create or get dropdown element
        let messageEl = document.querySelector(`.column[data-column-id="${columnId}"] .no-customers-message`);
        
        if (!messageEl) {
          messageEl = document.createElement('div');
          messageEl.className = 'no-customers-message';
          messageEl.textContent = 'No customer here';
          button.parentNode?.appendChild(messageEl);
          
          // Auto-hide after 1 second
          setTimeout(() => {
            if (messageEl && messageEl.parentNode) {
              messageEl.parentNode.removeChild(messageEl);
            }
          }, 1000);
        }
      }
      
      return;
    }
    
    setCollapsedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  // Check if a column is collapsed
  const isColumnCollapsed = (columnId: string) => {
    return collapsedColumns[columnId] || false;
  };

  const removePersonFromMainColumn = (personId: string) => {
    setColumns(prevColumns => {
      // Create a copy of the columns
      const newColumns = [...prevColumns];
      
      // Remove the person from the main customer column (index 0)
      newColumns[0] = {
        ...newColumns[0],
        people: newColumns[0].people.filter(p => p.id !== personId)
      };
      
      // Also remove the person from any day column they might be in
      for (let i = 1; i < newColumns.length; i++) {
        newColumns[i] = {
          ...newColumns[i],
          people: newColumns[i].people.filter(p => p.id !== personId)
        };
      }
      
      return newColumns;
    });
  };

  return (
    <div className="app-container">
      <h1>Customer Management</h1>
      
      <div className="app-header">
        <div className="add-person-input">
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPerson()}
            placeholder="Enter customer name..."
          />
          <button onClick={addPerson}>Add Customer</button>
        </div>
        
        <div className="print-controls">
          <button className="print-button" onClick={() => setShowPrintOptions(!showPrintOptions)}>
            Print
          </button>
          {showPrintOptions && (
            <div className="print-options">
              <button onClick={printAll}>Print All Columns</button>
              {columns.map(column => (
                <button key={column.id} onClick={() => printColumn(column.id)}>
                  Print {column.title} Only
                </button>
              ))}
              <button className="cancel-button" onClick={() => setShowPrintOptions(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="columns-container">
        {/* Main Customers Column */}
        <div className="column" data-column-id="customers">
          <div className="column-header">
            <h3>{columns[0].title} <span className="people-count">{columns[0].people.length}</span></h3>
          </div>
          
          {columns[0].people.map(person => {
            const dayColumn = getPersonDayColumn(person.id);
            return (
              <div 
                key={person.id} 
                className={`person-item ${highlightedPersonId === person.id ? 'highlighted' : ''}`}
              >
                <span className="person-name">{person.name}</span>
                <div className="person-actions">
                  {dayColumn && <span className="day-assignment">{dayColumn.title}</span>}
                  <button 
                    className="remove-person-btn" 
                    onClick={() => removePersonFromMainColumn(person.id)}
                    title="Remove customer"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Day Columns Section */}
        <div className="day-columns-section">
          {/* Day Columns Container */}
          <div className="day-columns-container">
            {/* Day Columns */}
            {columns.slice(1).map(column => (
              <div key={column.id} className="column" data-column-id={column.id}>
                <div className="column-header">
                  <h3 className="day-title">
                    {editingColumnId === column.id ? (
                      <div className="edit-day-form">
                        <input
                          type="number"
                          value={editDayNumber}
                          onChange={(e) => setEditDayNumber(e.target.value === '' ? '' : Number(e.target.value))}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditedDay()}
                          min="1"
                          autoFocus
                        />
                        <button onClick={saveEditedDay}>Save</button>
                        <button onClick={cancelEditingDay}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <button 
                          className="edit-day-btn" 
                          onClick={() => startEditingDay(column.id)}
                          title="Edit day number"
                        >
                          ✎
                        </button>
                        {column.title} 
                        <span className="people-count">{column.people.length}</span>
                      </>
                    )}
                  </h3>
                  <div className="actions">
                    <div 
                      className="dropdown" 
                      ref={(el) => setDropdownRef(el, column.id)}
                    >
                      <button onClick={() => toggleDropdown(column.id)}>+</button>
                      {activeDropdown === column.id && (
                        <div className="dropdown-content show">
                          {(() => {
                            // Get unassigned customers inside the render to ensure it's up-to-date
                            const unassignedCustomers = getUnassignedPeople();
                            console.log('Rendering dropdown with unassigned:', unassignedCustomers);
                            
                            return unassignedCustomers.length > 0 ? (
                              unassignedCustomers.map(person => (
                                <div 
                                  key={person.id} 
                                  className="dropdown-item"
                                  onClick={() => addPersonToColumn(column.id, person)}
                                >
                                  {person.name}
                                </div>
                              ))
                            ) : (
                              <div className="dropdown-item no-customers">No customers available</div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <button 
                      className="remove-column-btn" 
                      onClick={() => removeColumn(column.id)}
                      title="Remove column"
                    >
                      ×
                    </button>
                    <button 
                      className={`collapse-column-btn ${isColumnCollapsed(column.id) ? 'collapsed' : ''} ${column.people.length === 0 ? 'no-customers' : ''}`}
                      onClick={() => toggleColumnCollapse(column.id)}
                      title={column.people.length === 0 ? "No customer here" : isColumnCollapsed(column.id) ? "Expand column" : "Collapse column"}
                    >
                      {isColumnCollapsed(column.id) ? '▼' : '▲'}
                    </button>
                  </div>
                </div>
                
                {!isColumnCollapsed(column.id) && column.people.map(person => (
                  <div key={person.id} className="person-item">
                    {person.name}
                    <button 
                      className="remove-person-btn" 
                      onClick={() => removePersonFromColumn(column.id, person.id)}
                      title="Remove from this day"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                {isColumnCollapsed(column.id) && (
                  <div className="collapsed-info">
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Add Day Form */}
          <div className="add-day-container">
            {showDayInput ? (
              <div className="add-day-form">
                <input
                  type="number"
                  value={newDayNumber}
                  onChange={(e) => setNewDayNumber(e.target.value === '' ? '' : Number(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                  placeholder="Enter day number..."
                  min="1"
                  autoFocus
                />
                <button onClick={addColumn}>Add</button>
                <button onClick={() => setShowDayInput(false)}>Cancel</button>
              </div>
            ) : (
              <button className="add-column-btn" onClick={() => setShowDayInput(true)}>
                Add Day
        </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

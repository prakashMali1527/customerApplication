# Customer Management App

A web application for organizing customers across different days with customizable day columns.

## Features

- Main "Customers" column showing all customers with their day assignments
- Additional day columns with customizable numbers (e.g., #1 Day, #5 Day)
- Add customers to the main list and assign them to specific days
- Each customer can only be assigned to one day column at a time
- Columns display the count of customers assigned to them
- All lists are alphabetically sorted
- Data persists between browser sessions using localStorage
- Print functionality for the entire application or individual columns
- Edit day numbers after creation
- Responsive design with improved styling

## How to Run

### Development Mode

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Create optimized build
npm run build

# Preview the build
npm run preview
```

## Usage Instructions

For detailed usage instructions, please see the [Usage Instructions](USAGE_INSTRUCTIONS.md) document.

## Technical Details

This application is built with:
- React 18+
- TypeScript
- Vite
- CSS for styling
- Local Storage for data persistence
- Custom print functionality

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Implementation Details

The application uses React's state management to track:
- The list of customers
- The columns (days) and which customers are assigned to each
- The active dropdown menu
- Custom day numbers for each column
- Editing state for day numbers
- Count of customers in each column
- Ensuring each customer is only in one day column at a time
- Day assignments displayed in the main customers list
- Alphabetical sorting of all customers lists
- Saving data to localStorage for persistence between sessions
- Print functionality with custom formatting

Each customer and column has a unique ID to ensure proper tracking and updates.

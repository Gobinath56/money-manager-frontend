// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};


// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date and time
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0) + str.slice(1).toLowerCase();
};

// Get category color
export const getCategoryColor = (category) => {
  const colors = {
    FUEL: 'bg-yellow-100 text-yellow-800',
    MOVIE: 'bg-purple-100 text-purple-800',
    FOOD: 'bg-orange-100 text-orange-800',
    LOAN: 'bg-red-100 text-red-800',
    MEDICAL: 'bg-pink-100 text-pink-800',
    SALARY: 'bg-green-100 text-green-800',
    FREELANCE: 'bg-blue-100 text-blue-800',
    INVESTMENT: 'bg-indigo-100 text-indigo-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

// Calculate hours passed
export const getHoursPassed = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diff = now - created;
  return Math.floor(diff / (1000 * 60 * 60));
};

// Check if edit is allowed (within 12 hours)
export const isEditAllowed = (createdAt) => {
  return getHoursPassed(createdAt) <= 12;
};

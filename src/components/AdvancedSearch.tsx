import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AdvancedSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    fileType: string;
    category: string;
    dateFrom: string;
    dateTo: string;
    sizeMin: string;
    sizeMax: string;
    author: string;
    tags: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  categories: string[];
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  categories
}) => {
  const fileTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Documents' },
    { value: 'archive', label: 'Archives' }
  ];

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search files by name, description, author, or tags..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(filters).filter(v => v && v !== 'all').length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">File Type</label>
                  <Select
                    value={filters.fileType}
                    onValueChange={(value) => onFiltersChange({ ...filters, fileType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fileTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      placeholder="From"
                      value={filters.dateFrom}
                      onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                    />
                    <Input
                      type="date"
                      placeholder="To"
                      value={filters.dateTo}
                      onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">File Size (MB)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.sizeMin}
                      onChange={(e) => onFiltersChange({ ...filters, sizeMin: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.sizeMax}
                      onChange={(e) => onFiltersChange({ ...filters, sizeMax: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Author</label>
                  <Input
                    placeholder="Filter by author"
                    value={filters.author}
                    onChange={(e) => onFiltersChange({ ...filters, author: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <Input
                    placeholder="Filter by tags"
                    value={filters.tags}
                    onChange={(e) => onFiltersChange({ ...filters, tags: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
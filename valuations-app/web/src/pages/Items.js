import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import axios from 'axios';

const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Valuated', label: 'Valuated' },
  { value: 'Verified', label: 'Verified' },
];

function Items() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    orderId: '',
    itemName: '',
    category: '',
    description: '',
    estimatedValue: '',
    status: 'Pending',
    notes: '',
  });

  useEffect(() => {
    fetchItems();
    fetchOrders();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/items/pending-valuation');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpen = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        orderId: item.OrderId,
        itemName: item.ItemName,
        category: item.Category,
        description: item.Description,
        estimatedValue: item.EstimatedValue,
        status: item.Status,
        notes: item.Notes || '',
      });
    } else {
      setSelectedItem(null);
      setFormData({
        orderId: '',
        itemName: '',
        category: '',
        description: '',
        estimatedValue: '',
        status: 'Pending',
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await axios.put(`http://localhost:5000/api/items/${selectedItem.ItemId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/items', formData);
      }
      fetchItems();
      handleClose();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Items</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          New Item
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Estimated Value</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => (
                  <TableRow
                    hover
                    key={item.ItemId}
                    onClick={() => handleOpen(item)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{item.ItemId}</TableCell>
                    <TableCell>{item.ItemName}</TableCell>
                    <TableCell>{item.Category}</TableCell>
                    <TableCell>{item.Description}</TableCell>
                    <TableCell>${item.EstimatedValue}</TableCell>
                    <TableCell>{item.Status}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{selectedItem ? 'Edit Item' : 'New Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Order"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                required
              >
                {orders.map((order) => (
                  <MenuItem key={order.OrderId} value={order.OrderId}>
                    {order.ClientName} - {order.PolicyNumber}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Value"
                name="estimatedValue"
                type="number"
                value={formData.estimatedValue}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Items; 
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Autocomplete,
} from "@mui/material";
import {
  EditOutlined,
  PrintOutlined,
  DeleteOutlineOutlined,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  fetchTemporaryPasses,
  deleteTemporaryPass,
  fetchAllDepartments,
  fetchAllPickupPoints,
} from "../../../api/admin/api";
import TempPassReceiptDialog from "./TempPassReceiptDialog";
import EditPassDialog from "./EditPassDialog";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ManagePassesTab() {
  const { token } = useAuth();
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(null);
  const [pickupPoint, setPickupPoint] = useState(null);

  // Dynamic data from API
  const [departments, setDepartments] = useState([]);
  const [pickupPoints, setPickupPoints] = useState([]);

  const [receiptDialogData, setReceiptDialogData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passToDelete, setPassToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passToEdit, setPassToEdit] = useState(null);

  // Fetch departments and pickup points
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, pointRes] = await Promise.all([
          fetchAllDepartments(token),
          fetchAllPickupPoints(token),
        ]);
        if (deptRes.success) setDepartments(deptRes.departments);
        if (pointRes.success) setPickupPoints(pointRes.pickupPoints);
      } catch (err) {
        console.error("Failed to load filter data:", err);
      }
    };
    loadData();
  }, [token]);

  const loadPasses = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        department: department?.label || "",
        pickupPoint: pickupPoint?.label || "",
      };
      const res = await fetchTemporaryPasses(token, filters);
      setPasses(res.data);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, rowsPerPage, search, department, pickupPoint]);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  const handleDelete = async () => {
    if (!passToDelete) return;
    setDeleting(true);
    try {
      await deleteTemporaryPass(token, passToDelete._id);
      setDeleteDialogOpen(false);
      setPassToDelete(null);
      loadPasses();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Filters */}
      <Paper
        sx={{ p: 2, mb: 2, borderRadius: "12px", border: "1px solid #E2E8F0" }}
        elevation={0}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Search name, mobile, receipt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: "200px" }}
          />
          <Autocomplete
            options={departments}
            getOptionLabel={(opt) => opt.label}
            value={department}
            onChange={(e, val) => setDepartment(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Department"
                sx={{ width: "200px" }}
              />
            )}
          />
          <Autocomplete
            options={pickupPoints}
            getOptionLabel={(opt) => opt.label}
            value={pickupPoint}
            onChange={(e, val) => setPickupPoint(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Pickup Point"
                sx={{ width: "200px" }}
              />
            )}
          />
        </Box>
      </Paper>

      {/* Table */}
      <Paper
        sx={{
          flex: 1,
          overflow: "hidden",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
        }}
        elevation={0}
      >
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Receipt No.</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Trip Type</TableCell>
                <TableCell>Validity</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress sx={{ my: 4 }} />
                  </TableCell>
                </TableRow>
              ) : passes.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 4, color: "#64748B" }}
                  >
                    No passes found.
                  </TableCell>
                </TableRow>
              ) : (
                passes.map((pass) => (
                  <TableRow key={pass._id} hover>
                    <TableCell>
                      <strong>{pass.receiptNumber}</strong>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{pass.studentName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {pass.mobileNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>
                        {pass.pickupPoint?.label}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                        {pass.department?.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pass.tripType}
                        size="small"
                        sx={{
                          bgcolor: "#EFF6FF",
                          color: "#2563EB",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div style={{ fontSize: "0.8rem" }}>
                        {formatDate(pass.validFrom)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748B" }}>
                        to {formatDate(pass.validTo)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <strong>₹{pass.feeAmount}</strong>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          textTransform: "capitalize",
                          fontSize: "0.85rem",
                        }}
                      >
                        {pass.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View / Print">
                        <IconButton
                          size="small"
                          onClick={() => setReceiptDialogData(pass)}
                          sx={{ color: "#2563EB" }}
                        >
                          <PrintOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPassToEdit(pass);
                            setEditDialogOpen(true);
                          }}
                          sx={{ color: "#10B981" }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPassToDelete(pass);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{ color: "#EF4444" }}
                        >
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <TempPassReceiptDialog
        open={!!receiptDialogData}
        receiptData={receiptDialogData}
        onClose={() => setReceiptDialogData(null)}
      />

      {/* Beautiful Delete Confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <p style={{ margin: 0, color: "#475569" }}>
            Are you sure you want to delete the pass for{" "}
            <strong>{passToDelete?.studentName}</strong>? This action cannot be
            undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: "#64748B", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={deleting}
            sx={{
              bgcolor: "#EF4444",
              fontWeight: 700,
              "&:hover": { bgcolor: "#DC2626" },
            }}
          >
            {deleting ? "Deleting..." : "Delete Pass"}
          </Button>
        </DialogActions>
      </Dialog>

      <EditPassDialog
        open={editDialogOpen}
        passData={passToEdit}
        onClose={() => setEditDialogOpen(false)}
        onSave={() => {
          setEditDialogOpen(false);
          loadPasses();
        }}
      />
    </Box>
  );
}
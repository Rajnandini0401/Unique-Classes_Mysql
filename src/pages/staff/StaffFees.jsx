import React from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import Fees from '../admin/Fees';

const StaffFees = () => {
  return <Fees layoutWrapper={StaffLayout} isStaff={true} />;
};

export default StaffFees;

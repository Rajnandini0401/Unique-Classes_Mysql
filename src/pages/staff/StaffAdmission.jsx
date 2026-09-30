import React from 'react';
import NewAdmission from '../admin/NewAdmission';
import StaffLayout from '../../layouts/StaffLayout';

const StaffAdmission = () => {
  return (
    <NewAdmission
      layoutWrapper={StaffLayout}
      redirectPath="/staff/students"
    />
  );
};

export default StaffAdmission;

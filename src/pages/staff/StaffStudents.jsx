import React from 'react';
import AllStudents from '../admin/AllStudents';
import StaffLayout from '../../layouts/StaffLayout';

const StaffStudents = () => {
  return (
    <AllStudents
      layoutWrapper={StaffLayout}
      readOnly={true}
    />
  );
};

export default StaffStudents;

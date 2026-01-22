import { describe, it, expect } from '@jest/globals';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';

describe('Excel Parser Service', () => {
  it('should parse project data from Excel sheet', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Projects List');

    worksheet.columns = [
      { header: 'Client Name', key: 'clientName' },
      { header: 'Contract Code', key: 'contractCode' },
      { header: 'Contract Signing Date', key: 'contractSigningDate' },
      { header: 'Built-Up Area', key: 'builtUpArea' },
      { header: 'License Type', key: 'licenseType' },
      { header: 'Project Type', key: 'projectType' },
      { header: 'Requirements', key: 'requirements' },
      { header: 'Start Date', key: 'startDate' },
      { header: 'Estimated End Date', key: 'estimatedEndDate' },
    ];

    worksheet.addRow({
      clientName: 'Test Client',
      contractCode: 'CONTRACT-001',
      contractSigningDate: '2024-01-01',
      builtUpArea: 1000,
      licenseType: 'Commercial',
      projectType: 'Studies',
      requirements: 'Test requirements',
      startDate: '2024-01-15',
      estimatedEndDate: '2024-03-15',
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const parsedSheet = parsedWorkbook.Sheets['Projects List'];
    const data = XLSX.utils.sheet_to_json(parsedSheet);

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      clientName: 'Test Client',
      contractCode: 'CONTRACT-001',
      builtUpArea: 1000,
      licenseType: 'Commercial',
      projectType: 'Studies',
    });
  });

  it('should parse team member data from Excel sheet', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Team members Data');

    worksheet.columns = [
      { header: 'Name', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Position', key: 'position' },
      { header: 'Region', key: 'region' },
      { header: 'Grade', key: 'grade' },
      { header: 'Level', key: 'level' },
      { header: 'Monthly Cost', key: 'monthlyCost' },
    ];

    worksheet.addRow({
      name: 'John Doe',
      email: 'john@example.com',
      position: 'Architect',
      region: 'North',
      grade: 'A',
      level: 'Senior',
      monthlyCost: 5000,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const parsedSheet = parsedWorkbook.Sheets['Team members Data'];
    const data = XLSX.utils.sheet_to_json(parsedSheet);

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
      position: 'Architect',
      monthlyCost: 5000,
    });
  });

  it('should parse task data from Excel sheet', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');

    worksheet.columns = [
      { header: 'Project Code', key: 'projectCode' },
      { header: 'Phase', key: 'phase' },
      { header: 'Task Code', key: 'taskCode' },
      { header: 'Description', key: 'description' },
      { header: 'Duration (Days)', key: 'duration' },
    ];

    worksheet.addRow({
      projectCode: 'CONTRACT-001',
      phase: 'Studies',
      taskCode: 'TASK-001',
      description: 'Initial design review',
      duration: 15,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const parsedSheet = parsedWorkbook.Sheets['Tasks'];
    const data = XLSX.utils.sheet_to_json(parsedSheet);

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      projectCode: 'CONTRACT-001',
      phase: 'Studies',
      taskCode: 'TASK-001',
      description: 'Initial design review',
      'Duration (Days)': 15,
    });
  });

  it('should handle empty rows in Excel sheet', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');

    worksheet.columns = [{ header: 'Name', key: 'name' }];
    worksheet.addRow({ name: 'Test' });
    worksheet.addRow({ name: '' });

    const buffer = await workbook.xlsx.writeBuffer();

    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });
    const parsedSheet = parsedWorkbook.Sheets['Test'];
    const data = XLSX.utils.sheet_to_json(parsedSheet);

    expect(data).toHaveLength(2);
  });

  it('should parse multiple sheets from Excel file', async () => {
    const workbook = new ExcelJS.Workbook();
    
    const sheet1 = workbook.addWorksheet('Sheet1');
    sheet1.columns = [{ header: 'Name', key: 'name' }];
    sheet1.addRow({ name: 'Test 1' });

    const sheet2 = workbook.addWorksheet('Sheet2');
    sheet2.columns = [{ header: 'Value', key: 'value' }];
    sheet2.addRow({ value: 100 });

    const buffer = await workbook.xlsx.writeBuffer();

    const parsedWorkbook = XLSX.read(buffer, { type: 'buffer' });

    expect(parsedWorkbook.SheetNames).toHaveLength(2);
    expect(parsedWorkbook.SheetNames).toEqual(['Sheet1', 'Sheet2']);
  });
});

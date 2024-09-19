import React, { useState, useEffect } from "react"
import { Table, Modal, Row, Col, Card, Typography, Space } from "antd"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import axios from "axios"
import {
  DollarOutlined,
  TeamOutlined,
  BarChartOutlined,
} from "@ant-design/icons"
import { log } from "console"

const { Title, Text } = Typography

interface SalaryData {
  work_year: number
  experience_level: string
  employment_type: string
  job_title: string
  salary: number
  salary_currency: string
  salary_in_usd: number
  employee_residence: string
  remote_ratio: number
  company_location: string
  company_size: string
}

const URL = process.env.REACT_APP_URL as string

const App: React.FC = () => {
  const [data, setData] = useState<SalaryData[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [yearData, setYearData] = useState<SalaryData[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  console.log(URL)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true) // Start loading
    try {
      const response = await axios.get(URL)
      setData(response.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false) // Stop loading after fetching data
    }
  }

  const columns = [
    {
      title: "Year",
      dataIndex: "work_year",
      key: "work_year",
      sorter: (a: SalaryData, b: SalaryData) => a.work_year - b.work_year,
    },
    {
      title: "Number of Jobs",
      dataIndex: "jobCount",
      key: "jobCount",
      sorter: (a: any, b: any) => a.jobCount - b.jobCount,
    },
    {
      title: "Average Salary (USD)",
      dataIndex: "avgSalary",
      key: "avgSalary",
      sorter: (a: any, b: any) => a.avgSalary - b.avgSalary,
      render: (value: number) => `$${value.toLocaleString()}`,
    },
  ]

  const processedData = Object.values(
    data.reduce((acc: any, curr) => {
      if (!acc[curr.work_year]) {
        acc[curr.work_year] = {
          work_year: curr.work_year,
          jobCount: 0,
          totalSalary: 0,
        }
      }
      acc[curr.work_year].jobCount++
      acc[curr.work_year].totalSalary += curr.salary_in_usd
      return acc
    }, {})
  ).map((item: any) => ({
    ...item,
    avgSalary: Math.round(item.totalSalary / item.jobCount),
  }))

  const handleRowClick = async (record: any) => {
    const response = await axios.get(`${URL}/${record.work_year}`)
    setYearData(response.data)
    setSelectedYear(record.work_year)
    setIsModalVisible(true)
  }

  const jobTitlesData = yearData.reduce((acc: any, curr) => {
    if (!acc[curr.job_title]) {
      acc[curr.job_title] = 0
    }
    acc[curr.job_title]++
    return acc
  }, {})

  const jobTitlesColumns = [
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      key: "jobTitle",
    },
    {
      title: "Number of Jobs",
      dataIndex: "jobCount",
      key: "jobCount",
    },
  ]

  const jobTitlesTableData = Object.entries(jobTitlesData)
    .map(([jobTitle, jobCount]) => ({
      jobTitle,
      jobCount,
    }))
    .sort((a: any, b: any) => b.jobCount - a.jobCount)

  const totalJobs = processedData.reduce((sum, year) => sum + year.jobCount, 0)
  const averageSalary = Math.round(
    processedData.reduce((sum, year) => sum + year.avgSalary, 0) /
      processedData.length
  )

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
      }}
    >
      <Title level={2} style={{ marginBottom: "24px", textAlign: "center" }}>
        ML Engineer and Data Science Salaries (2020-2024)
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            {" "}
            // Added loading prop
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Total Jobs</Text>
              <Title level={3}>
                <TeamOutlined style={{ marginRight: "8px" }} />
                {isLoading ? "..." : totalJobs.toLocaleString()} // Show loading
                text
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            {" "}
            // Added loading prop
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Average Salary</Text>
              <Title level={3}>
                <DollarOutlined style={{ marginRight: "8px" }} />$
                {isLoading ? "..." : averageSalary.toLocaleString()} // Show
                loading text
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            {" "}
            // Added loading prop
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Years of Data</Text>
              <Title level={3}>
                <BarChartOutlined style={{ marginRight: "8px" }} />
                {isLoading ? "..." : processedData.length} // Show loading text
              </Title>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: "24px" }}>
        <Title level={4}>Average Salary Trend</Title>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={processedData}>
            <XAxis dataKey="work_year" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip
              formatter={(value) => `$${(value as number).toLocaleString()}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgSalary"
              stroke="#1890ff"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ marginTop: "24px" }}>
        <Title level={4}>Yearly Salary Data</Title>
        <Text
          type="secondary"
          style={{ marginBottom: "16px", display: "block" }}
        >
          Click on a row to see detailed job titles for that year
        </Text>
        <Table
          dataSource={processedData}
          columns={columns}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: "pointer" },
          })}
          pagination={false}
        />
      </Card>

      <Modal
        title={`Job Titles for ${selectedYear}`}
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Table
          dataSource={jobTitlesTableData}
          columns={jobTitlesColumns}
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  )
}

export default App

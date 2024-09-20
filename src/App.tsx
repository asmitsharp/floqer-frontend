import React, { useState, useEffect, useMemo } from "react"
import {
  Table,
  Modal,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Input,
  Button,
  List,
} from "antd"
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
  SendOutlined,
} from "@ant-design/icons"
import { Console } from "console"

const { Title, Text } = Typography
const { TextArea } = Input

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

interface ChatMessage {
  text: string
  sender: "user" | "ai"
}

const URL = process.env.REACT_APP_URL as string

const App: React.FC = () => {
  const [data, setData] = useState<SalaryData[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [yearData, setYearData] = useState<SalaryData[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")

  console.log(URL)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get("/api/salaries")
      setData(response.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const processedData = useMemo(() => {
    return Object.values(
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
  }, [data])

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

  const handleRowClick = async (record: any) => {
    const response = await axios.get(`/api/salaries/${record.work_year}`)
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

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return

    const newUserMessage = { text: inputMessage, sender: "user" as const }
    setChatMessages([...chatMessages, newUserMessage])
    setInputMessage("")

    try {
      const response = await axios.post("/api/salaries/chat", {
        message: inputMessage,
      })
      console.log(response)

      const newAiMessage = {
        text: response.data.response,
        sender: "ai" as const,
      }
      console.log(newAiMessage)

      setChatMessages((prevMessages) => [...prevMessages, newAiMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = {
        text: "Sorry, there was an error processing your request.",
        sender: "ai" as const,
      }
      setChatMessages((prevMessages) => [...prevMessages, errorMessage])
    }
  }

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
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Total Jobs</Text>
              <Title level={3}>
                <TeamOutlined style={{ marginRight: "8px" }} />
                {isLoading ? "..." : totalJobs.toLocaleString()}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Average Salary</Text>
              <Title level={3}>
                <DollarOutlined style={{ marginRight: "8px" }} />$
                {isLoading ? "..." : averageSalary.toLocaleString()}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <Text type="secondary">Years of Data</Text>
              <Title level={3}>
                <BarChartOutlined style={{ marginRight: "8px" }} />
                {isLoading ? "..." : processedData.length}
              </Title>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
        <Col xs={24} lg={12}>
          <Card>
            <Title level={4}>Average Salary Trend</Title>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={processedData}>
                <XAxis dataKey="work_year" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value) =>
                    `$${(value as number).toLocaleString()}`
                  }
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
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ height: "100%" }}>
            <Title level={4}>Chat with AI Assistant</Title>
            <List
              dataSource={chatMessages}
              renderItem={(item) => (
                <List.Item
                  style={{
                    justifyContent:
                      item.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <Card
                    style={{
                      maxWidth: "80%",
                      backgroundColor:
                        item.sender === "user" ? "#e6f7ff" : "#f0f0f0",
                    }}
                  >
                    <Text>{item.text}</Text>
                  </Card>
                </List.Item>
              )}
              style={{
                height: "250px",
                overflowY: "auto",
                marginBottom: "16px",
              }}
            />
            <Space.Compact style={{ width: "100%" }}>
              <TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about ML Engineer salaries..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                onPressEnter={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
              >
                Send
              </Button>
            </Space.Compact>
          </Card>
        </Col>
      </Row>

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

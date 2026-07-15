---
title: LangGraph 学习笔记
description: 从概念到实战,系统梳理 LangGraph 的一份学习笔记,包含 State、Node、Edge、Checkpointer 等核心概念以及完整实战示例。
outline: [2, 3]
---

# LangGraph 学习笔记

> 🎯 给想用 LangGraph 写 Agent 的前端同学

## 一、什么是 LangGraph?

### 1.1 先说 LangChain 的 Chain

想象你要做一道「西红柿炒鸡蛋」:

```
食材 → 洗菜 → 切菜 → 炒制 → 装盘
```

LangChain 的 **Chain** 就是这样一条**流水线**(Pipeline):

- 输入一个东西,按顺序一步步处理
- 每一步输出作为下一步输入
- **线性流程**,从哪进从哪出,中间没法回头

### 1.2 LangGraph 是什么?

现在想象你要开发一个**智能客服机器人**:

```
用户说"我要退款"
    ↓
客服说:"订单号是什么?"
    ↓
用户说:"12345"
    ↓
客服说:"正在查询..."
    ↓
根据订单状态,可能:
    - 状态正常 → 走退款流程
    - 状态异常 → 告诉用户原因
    ↓
最后结束对话
```

这个场景有什么特点?

- **不是一条直线**,中间有很多分支
- **需要记住之前说过什么**(状态)
- **可能循环**(用户没听懂就再解释一遍)
- **有起点和终点**

**LangGraph 就是为此而生的!** 它把 AI 应用的**每一个**做成一个**图(Graph)**,节点是处理步骤,边是流转逻辑。

### 1.3 一句话总结

| 技术            | 特点                 | 类比          |
| --------------- | -------------------- | ------------- |
| LangChain Chain | 线性流程,一步接一步 | 工厂流水线    |
| LangGraph       | 图结构,支持分支和循环 | 决策树/流程图 |

## 二、State(状态)—— 你的"记忆的存"

### 2.1 为什么需要 State?

想象你跟客服聊天:

```
你:我要查订单
客服:请问订单号?
你:12345
客服:请稍等...
你:顺便帮我看看物流
客服:好的...你的订单12345,物流显示在派送中
```

客服能回答"顺便帮我看看物流",是因为它**记住了之前的对话内容**。这个"记忆"就是 State。

### 2.2 State 的定义方式

LangGraph 支持三种方式定义状态,选一个你顺手的:

#### 方式一:TypedDict(字典风格,推荐新手)

```python
from typing import TypedDict

class OrderState(TypedDict):
    """订单查询的状态"""
    user_message: str          # 用户最新说的话
    order_id: str | None       # 订单号(可能是空的)
    order_info: dict | None    # 查询到的订单信息
    response: str              # 回复用户的内容
    history: list[str]          # 对话历史
```

#### 方式二:Pydantic(类型安全,推荐生产用)

```python
from pydantic import BaseModel, Field

class OrderState(BaseModel):
    """订单查询的状态"""
    user_message: str = Field(default="", description="用户说的话")
    order_id: str | None = Field(default=None, description="订单号")
    order_info: dict | None = Field(default=None, description="订单信息")
    response: str = Field(default="", description="回复内容")
    history: list[str] = Field(default_factory=list, description="对话历史")
```

#### 方式三:dataclass(Python 原生风格)

```python
from dataclasses import dataclass, field

@dataclass
class OrderState:
    """订单查询的状态"""
    user_message: str = ""
    order_id: str | None = None
    order_info: dict | None = None
    response: str = ""
    history: list[str] = field(default_factory=list)
```

### 2.3 怎么选?

| 方式      | 优点                   | 适用场景              |
| --------- | ---------------------- | --------------------- |
| TypedDict | 简单直观,像字典     | 快速原型、简单场景    |
| Pydantic  | 类型校验严格,有默认值 | **生产环境首选**      |
| dataclass | Python 原生的样板       | 熟悉 dataclass 的同学 |

**小抄建议**:咱们做项目用 **Pydantic**,虽然看起来稍微麻烦点,但类型安全,出错了好排查。

## 三、Node(节点)—— 每个处理步骤

### 3.1 什么是 Node?

Node 就是图里的**每个方块**,代表一个具体的功能:

```
┌─────────────┐
│   接收消息   │  ← Node 1
└──────┬──────┘
       ↓
┌─────────────┐
│   理解意图   │  ← Node 2
└──────┬──────┘
       ↓
┌─────────────┐
│   执行动作   │  ← Node 3
└──────┬──────┘
       ↓
┌─────────────┐
│   生成回复   │  ← Node 4
└─────────────┘
```

### 3.2 怎么定义 Node?

Node 本质上就是一个**函数**,输入是当前 state,输出是**要更新的 state 字段**:

```python
# 定义一个"接收消息"的节点
def receive_message(state: OrderState) -> OrderState:
    """
    接收用户消息,记录到历史

    Args:
        state: 当前状态(包含用户最新说的话)

    Returns:
        要更新的状态(只更新部分字段)
    """
    user_msg = state["user_message"]

    # 更新历史记录
    new_history = state.get("history", []) + [f"用户: {user_msg}"]

    return {
        "history": new_history
    }


# 定义一个"提取订单号"的节点
def extract_order_id(state: OrderState) -> OrderState:
    """
    从用户消息中提取订单号
    假设用简单的关键词匹配
    """
    msg = state["user_message"]

    # 简单示例:抽取 "订单号" 后面的数字
    order_id = None
    if "订单号" in msg or "订单" in msg:
        import re
        match = re.search(r'\d+', msg)
        if match:
            order_id = match.group()

    return {"order_id": order_id}


# 定义一个"查询订单"的节点
def query_order(state: OrderState) -> OrderState:
    """
    根据订单号查询订单信息
    """
    order_id = state.get("order_id")

    if not order_id:
        return {"order_info": None, "response": "没找到订单号,请提供订单号"}

    # 这里假装调用了订单服务
    mock_order = {
        "id": order_id,
        "status": "配送中",
        "items": ["行车记录仪", "车载充电器"]
    }

    return {
        "order_info": mock_order,
        "response": f"查到啦!订单{order_id}正在配送中"
    }
```

### 3.3 Node 的小技巧

```python
# 💡 一个 Node 可以只更新部分字段,其他字段保持不变
def just_say_hello(state: OrderState) -> OrderState:
    return {"response": "你好,有什么可以帮你?"}
    # 只有 response 被更新,其他字段不变!

# 💡 可以返回空字典表示什么都不更新
def maybe_skip(state: OrderState) -> OrderState:
    if some_condition:
        return {"response": "跳过处理"}
    return {}  # 什么都不改
```

## 四、Edge(边)—— 流转逻辑

### 4.1 什么是 Edge?

Edge 就是连接各个 Node 的**箭头**,决定了下一步去哪:

```
    ┌─────────────┐
    │  理解意图   │
    └──────┬──────┘
           ↓
     ┌─────┴─────┐
     ↓           ↓
┌─────────┐  ┌─────────┐
│ 查订单  │  │ 查物流  │
└────┬────┘  └────┬────┘
     ↓            ↓
     └──────┬─────┘
           ↓
    ┌─────────────┐
    │  生成回复   │
    └─────────────┘
```

### 4.2 普通边(Unconditional Edge)

普通边最简单,**无条件跳转**,从 A 出来一定要去 B:

```python
from langgraph.graph import StateGraph

# 创建图
graph = StateGraph(OrderState)

# 添加节点
graph.add_node("接收消息", receive_message)
graph.add_node("理解意图", extract_order_id)
graph.add_node("查询订单", query_order)

# 设置普通边:接收消息 → 理解意图 → 查询订单
graph.add_edge("接收消息", "理解意图")
graph.add_edge("理解意图", "查询订单")
```

### 4.3 条件边(Conditional Edge)

条件边更灵活,**根据情况决定下一步去哪**:

```python
# 定义路由函数,决定下一步去哪
def route_next(state: OrderState) -> str:
    """
    根据当前状态决定下一步

    Returns:
        下一个节点的名称
    """
    order_id = state.get("order_id")

    if order_id:
        return "查询订单"       # 有订单号 → 查询订单
    else:
        return "询问订单号"     # 没订单号 → 继续问
```

然后把它加到图里:

```python
# 添加条件边:从"理解意图"开始,根据 route_next 的返回值决定下一步
graph.add_conditional_edges(
    "理解意图",           # 起点节点
    route_next,           # 路由函数
    {
        "查询订单": "查询订单",      # 返回 "查询订单" → 去这个节点
        "询问订单号": "询问订单号"    # 返回 "询问订单号" → 去这个节点
    }
)
```

### 4.4 边的语法糖

```python
# 💡 如果你的路由函数返回值正好是目标节点名,可以简化:
graph.add_conditional_edges(
    "理解意图",
    route_next,
    # 直接传一个列表,节点名就是返回值
    ["查询订单", "询问订单号"]
)

# 💡 如果只想在某些条件下停止,可以这样:
def route_end_or_continue(state: OrderState) -> str:
    if state.get("should_end"):
        return END  # langgraph.constants.END 表示结束
    return "继续处理"
```

## 五、Graph(图)的搭建流程

### 5.1 完整搭建步骤

用一个完整的例子串起所有知识点:

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

# ========== 第一步:定义状态 ==========
class ChatState(TypedDict):
    messages: list[str]           # 对话消息列表
    current_intent: str | None    # 当前识别到的意图
    result: str | None            # 处理结果
    step_count: int               # 步数计数(防止死循环)

# ========== 第二步:定义节点函数 ==========
def start_node(state: ChatState) -> ChatState:
    """开始节点"""
    return {"step_count": 1}

def process_node(state: ChatState) -> ChatState:
    """处理节点"""
    return {
        "result": f"处理了第 {state['step_count']} 步",
        "step_count": state["step_count"] + 1
    }

def end_node(state: ChatState) -> ChatState:
    """结束节点"""
    return {"result": "任务完成!"}

# ========== 第三步:创建图 ==========
graph = StateGraph(ChatState)

# ========== 第四步:添加节点 ==========
graph.add_node("开始", start_node)
graph.add_node("处理", process_node)
graph.add_node("结束", end_node)

# ========== 第五步:添加边 ==========
# 普通边
graph.add_edge("开始", "处理")

# 条件边:处理完判断是否继续
def should_continue(state: ChatState) -> str:
    if state["step_count"] >= 3:  # 做3次就停
        return "结束"
    return "处理"  # 继续处理

graph.add_conditional_edges(
    "处理",
    should_continue,
    {"结束": "结束", "处理": "处理"}
)

# ========== 第六步:设置入口点 ==========
graph.set_entry_point("开始")

# ========== 第七步:编译图 ==========
app = graph.compile()

# ========== 第八步:执行 ==========
result = app.invoke({"messages": [], "step_count": 0})
print(result)
```

### 5.2 搭建流程图解

```
┌─────────────────────────────────────────────────────────────┐
│                      搭建流程                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 定义 State    ← 你要存什么数据?                        │
│         ↓                                                   │
│  2. 定义 Nodes    ← 有哪些处理步骤?                        │
│         ↓                                                   │
│  3. StateGraph() ← 创建空画布                              │
│         ↓                                                   │
│  4. add_node()   ← 把节点粘上去                            │
│         ↓                                                   │
│  5. add_edge()   ← 给箭头连接                              │
│         ↓                                                   │
│  6. set_entry... ← 标记入口                                │
│         ↓                                                   │
│  7. compile()    ← 打包成可执行的应用                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 六、执行方式

### 6.1 invoke(同步执行)

适合一次性拿到完整结果:

```python
# 同步执行,一次性返回结果
result = app.invoke({
    "messages": ["你好,我想查订单12345"],
    "current_intent": None,
    "result": None,
    "step_count": 0
})

print(result)
# {'messages': [...], 'current_intent': ..., 'result': '...', 'step_count': 3}
```

### 6.2 stream(流式执行)

适合需要**逐步看结果**的场景,比如 AI 对话打字效果:

```python
# 流式执行:一步一步返回
for step in app.stream({"messages": [], "step_count": 0}):
    print("当前步骤:", step)
    print("---")

# 输出类似:
# 当前步骤: {'开始': {'step_count': 1}}
# ---
# 当前步骤: {'处理': {'result': '处理了第 1 步', 'step_count': 2}}
# ---
# 当前步骤: {'结束': {'result': '任务完成!'}}
# ---
```

### 6.3 stream + AI 对话(常用组合)

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

def chat_node(state: ChatState) -> ChatState:
    """调用 LLM 生成回复"""
    messages = state["messages"]
    response = llm.invoke(messages)
    return {"messages": messages + [response.content]}

# 搭配 .stream() 实现打字机效果
for chunk in app.stream({"messages": [("user", "你好")]}):
    if "chat" in chunk:
        print(chunk["chat"]["messages"][-1], end="", flush=True)
```

## 七、进阶:Checkpointer(存档点)

### 7.1 什么是 Checkpointer?

想象你玩 RPG 游戏,存档点就是 Checkpointer:

- 游戏里你走到一半,可以**保存进度**
- 退出游戏后再回来,从**存档点继续**
- 不需要从头开始

LangGraph 的 Checkpointer 就是这个**存档机制**!

### 7.2 为什么需要?

1. **对话记忆**:用户刷新页面后再来,还能继续之前的对话
2. **容错恢复**:服务挂了,从最近的存档恢复
3. **多轮对话**:同一个对话线程里,记住之前说了啥

### 7.3 怎么用?

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph

# 创建一个内存存储的 checkpointer
memory = MemorySaver()

# 编译图的时候传入 checkpointer
graph = StateGraph(ChatState)
# ... 添加节点和边 ...
app = graph.compile(checkpointer=memory)

# 创建一个"线程"(类似会话 ID)
config = {"configurable": {"thread_id": "user_123_session_1"}}

# 第一次对话
result1 = app.invoke(
    {"messages": ["你好"]},
    config=config  # 带上配置!
)
print(result1["messages"])

# 第二次对话(在同一个线程里)
result2 = app.invoke(
    {"messages": ["帮我查查我的订单"]},
    config=config  # 同一个配置,会自动记住之前的状态
)
print(result2["messages"])  # 会包含之前"你好"的历史
```

### 7.4 其他存储后端

| 存储方式      | 适用场景 | 示例                   |
| ------------- | -------- | ---------------------- |
| MemorySaver   | 开发调试 | 内存存储,重启就没了   |
| SqliteSaver   | 小型项目 | SQLite 数据库          |
| PostgresSaver | 生产环境 | PostgreSQL,支持多实例 |
| RedisSaver    | 高并发   | Redis,快速读写        |

生产环境推荐:

```python
from langgraph.checkpoint.postgres import PostgresSaver

# PostgreSQL 存储
checkpointer = PostgresSaver.from_conn_string("postgresql://user:pass@host/db")
checkpointer.setup()  # 初始化表结构
app = graph.compile(checkpointer=checkpointer)
```

## 八、进阶:Memory(对话记忆)

### 8.1 Memory 和 Checkpointer 的关系

- **Checkpointer**:负责**保存和恢复**状态
- **Memory**:在 Checkpointer 基础上,提供**便捷的对话历史管理**

简单说,Memory 是 Checkpointer 的高级封装。

### 8.2 简单对话示例

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from typing import TypedDict

llm = ChatOpenAI(model="gpt-4o")

class ConversationState(TypedDict):
    messages: list  # 对话消息历史

graph = StateGraph(ConversationState)
memory = MemorySaver()

# 聊天节点
def chat(state: ConversationState) -> ConversationState:
    response = llm.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}

graph.add_node("chat", chat)
graph.set_entry_point("chat")
graph.add_edge("chat", END)
app = graph.compile(checkpointer=memory)

# 创建新对话
config = {"configurable": {"thread_id": "conversation_001"}}

# 对话第一轮
app.invoke(
    {"messages": [("user", "我叫小明")]},
    config=config
)

# 对话第二轮
app.invoke(
    {"messages": [("user", "你记得我叫什么吗?")]},
    config=config
)

# 输出会显示 AI "记得" 你叫小明
```

### 8.3 手动管理历史

有时候你想**主动清空记忆**或者**注入系统提示**:

```python
# 方式1:直接修改 state
new_state = {
    "messages": [("system", "你是一个有用的助手")]
}
app.update_state(config, new_state)

# 方式2:重新开始一个会话
new_config = {"configurable": {"thread_id": "new_conversation_002"}}

# 方式3:只获取最近 N 条消息
def trim_messages(messages, keep_last=10):
    """只保留最近 N 条"""
    system_msgs = [m for m in messages if m.type == "system"]
    other_msgs = [m for m in messages if m.type != "system"]
    return system_msgs + other_msgs[-keep_last:]
```

## 九、实用技巧

### 9.1 调试方法

#### 方法1:print 大法(简单粗暴)

```python
def debug_node(state: ChatState) -> ChatState:
    print(f"🔍 进入节点,当前状态: {state}")
    result = do_something(state)
    print(f"✅ 节点执行完,返回: {result}")
    return result
```

#### 方法2:流式输出看步骤

```python
# 用 stream 模式看每一步执行了什么
for step_name, step_data in app.stream(initial_state):
    print(f"\n{'='*50}")
    print(f"📍 步骤: {step_name}")
    print(f"📦 数据: {step_data}")
```

#### 方法3:可视化查看图结构

```python
# 生成 Mermaid 图表代码
mermaid_code = app.get_graph().draw_mermaid()
print(mermaid_code)

# 或者用 ASCII 图
ascii_graph = app.get_graph().print_ascii()
print(ascii_graph)
```

### 9.2 常见坑

#### 坑1:忘记传 config

```python
# ❌ 错误:没传 config,状态不会保存
result = app.invoke({"messages": ["hi"]})

# ✅ 正确:传 config
config = {"configurable": {"thread_id": "some_id"}}
result = app.invoke({"messages": ["hi"]}, config=config)
```

#### 坑2:State 定义和实际返回不匹配

```python
class State(TypedDict):
    name: str
    age: int

# ❌ 错误:返回了不存在的字段
def bad_node(state: State) -> State:
    return {"name": "小明", "age": 25, "gender": "男"}  # 多了一个 gender!

# ✅ 正确:只返回要更新的字段
def good_node(state: State) -> State:
    return {"name": "小明", "age": 25}
```

#### 坑3:死循环

```python
# ❌ 危险:没有退出条件,会一直循环
def always_continue(state):
    return "process"  # 永远返回同一个节点!

# ✅ 安全:设置最大循环次数
def safe_continue(state):
    if state.get("step", 0) >= 10:  # 最多执行 10 次
        return END
    return "process"
```

#### 坑4:节点函数必须是纯函数吗?

**不是!** 但要注意:

```python
# ✅ 可以调用外部 API
def call_api(state):
    result = requests.get("https://api.example.com/data")
    return {"api_result": result.json()}

# ⚠️ 有副作用的函数可能让测试变难
# 💡 建议:把副作用隔离到单独的节点,方便测试
```

### 9.3 性能优化小技巧

```python
# 1. 用 batch 批量处理
results = app.batch([state1, state2, state3])

# 2. 合理设置超时
result = app.invoke(state, timeout=30)  # 30 秒超时

# 3. 减少不必要的状态更新
def efficient_node(state):
    # ❌ 不好的做法:每次都更新整个历史
    return {"history": state["history"] + [new_msg]}

    # ✅ 好的做法:用 LLM 的消息对象
    return {"messages": state["messages"] + [new_message_obj]}
```

## 十、实战:汽车影音 Agent 示例

结合咱们的项目,来看一个简单的例子:

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict

class CarMediaState(TypedDict):
    """汽车影音系统状态"""
    user_input: str              # 用户说的话
    intent: str | None           # 识别的意图:播放音乐/导航/打电话
    media_name: str | None       # 媒体名称(歌名/地址/联系人)
    response: str                # 系统回复
    history: list[str]           # 对话历史

# 节点定义
def recognize_intent(state: CarMediaState) -> CarMediaState:
    """识别用户意图"""
    text = state["user_input"].lower()

    if "音乐" in text or "歌" in text or "播放" in text:
        return {"intent": "play_music", "response": "好的,正在播放音乐"}
    elif "导航" in text or "去" in text:
        return {"intent": "navigation", "response": "好的,正在规划路线"}
    elif "电话" in text or "拨打" in text:
        return {"intent": "call", "response": "好的,正在拨打"}
    else:
        return {"intent": "unknown", "response": "抱歉,我没听明白"}

def play_music(state: CarMediaState) -> CarMediaState:
    """播放音乐"""
    return {"response": f"正在播放您喜欢的歌曲"}

def navigation(state: CarMediaState) -> CarMediaState:
    """导航"""
    return {"response": "已规划好路线,预计30分钟到达"}

def call(state: CarMediaState) -> CarMediaState:
    """打电话"""
    return {"response": "正在拨打..."}

def unknown_intent(state: CarMediaState) -> CarMediaState:
    """无法识别"""
    return {"response": "请再说一遍?"}

# 搭建图
graph = StateGraph(CarMediaState)

graph.add_node("recognize", recognize_intent)
graph.add_node("play_music", play_music)
graph.add_node("navigation", navigation)
graph.add_node("call", call)
graph.add_node("unknown", unknown_intent)

# 设置入口
graph.set_entry_point("recognize")

# 条件边:根据意图分流
def route_intent(state: CarMediaState) -> str:
    return state.get("intent", "unknown")

graph.add_conditional_edges(
    "recognize",
    route_intent,
    {
        "play_music": "play_music",
        "navigation": "navigation",
        "call": "call",
        "unknown": "unknown"
    }
)

# 所有意图节点结束后结束
for node in ["play_music", "navigation", "call", "unknown"]:
    graph.add_edge(node, END)

# 编译
memory = MemorySaver()
app = graph.compile(checkpointer=memory)

# 使用
config = {"configurable": {"thread_id": "car_media_session"}}

# 测试
result = app.invoke(
    {"user_input": "播放周杰伦的歌", "history": []},
    config=config
)
print(result["response"])  # 输出: 好的,正在播放音乐
```

## 十一、深入 State:核心中的核心

前面章节把 State 的定义方式讲了个大概,这一节我们把它单独拎出来,系统地讲透。**State 是 LangGraph 的核心概念,理解它就理解了 LangGraph 的一切**。

### 11.1 State 是什么?

#### 官方定义

**State = 整个工作流的共享数据容器**

所有节点(接收消息、理解意图、执行动作等)都读写这个统一的数据对象。

#### 核心特征

- **共享**:所有节点共享同一个 State 实例
- **统一**:节点之间不靠传参通信,靠读写 State 通信
- **持久**:贯穿整个工作流的生命周期

#### 作用

| 作用     | 说明                |
| -------- | ------------------- |
| 保存输入 | 用户消息、请求参数    |
| 保存历史 | 对话历史、操作记录    |
| 保存中间结果 | 意图识别结果、查询结果 |
| 保存输出 | 最终回复、处理结果    |

**一句话总结:State 是整个工作流的唯一数据通道。**

### 11.2 State 的使用流程

```
Step 1: 定义 State 结构
    ↓
Step 2: 创建图时绑定 State
    ↓
Step 3: 节点中读/写 State
```

#### Step 1:定义 State

```python
from typing import TypedDict

class AgentState(TypedDict):
    user_input: str
    intent: str
    result: str
    history: list[str]
```

#### Step 2:绑定到图

```python
from langgraph.graph import StateGraph

graph = StateGraph(AgentState)
```

#### Step 3:节点中读写

**读取 State**:

```python
def process_node(state: AgentState) -> dict:
    # 方式一:直接读取
    user_input = state["user_input"]

    # 方式二:安全读取(推荐)
    history = state.get("history", [])

    return {"result": "处理完成"}
```

**更新 State**:

```python
def update_node(state: AgentState) -> dict:
    # 返回要更新的字段
    return {
        "intent": "play_music",
        "history": state.get("history", []) + ["新消息"]
    }
    # 其他字段保持不变
```

### 11.3 State 的工作原理

#### 核心机制

```
┌─────────────────────────────────────────────┐
│                  State                       │
│  {user_input, intent, result, history, ...}  │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───────┐    ┌───────┐    ┌───────┐
│ Node1 │    │ Node2 │    │ Node3 │
│ 读/写 │    │ 读/写 │    │ 读/写 │
└───────┘    └───────┘    └───────┘
    │             │             │
    │             │             │
  返回更新     返回更新     返回更新
    │             │             │
    └─────────────┼─────────────┘
                  ↓
           自动合并到 State
```

#### 更新规则

| 规则   | 说明                        |
| ---- | ------------------------- |
| 共享   | 所有节点共享同一个 State 实例        |
| 只读   | 节点不能直接修改原 State           |
| 返回更新 | 节点返回要更新的字段字典              |
| 自动合并 | LangGraph 自动将返回值合并到 State |

#### 数据流转示例

```python
# 初始 State
state = {"user_input": "播放音乐", "intent": None, "history": []}

# 节点1:识别意图
return {"intent": "play_music"}
# State 变为:{"user_input": "播放音乐", "intent": "play_music", "history": []}

# 节点2:执行并记录
return {"history": state["history"] + ["播放了音乐"]}
# State 变为:{"user_input": "播放音乐", "intent": "play_music", "history": ["播放了音乐"]}
```

### 11.4 正确 vs 错误写法

#### 正确写法

```python
def good_node(state: AgentState) -> dict:
    # ✅ 安全读取
    history = state.get("history", [])

    # ✅ 返回新值(不修改原 State)
    return {
        "history": history + ["新消息"],
        "result": "处理完成"
    }
```

#### 错误写法

```python
def bad_node(state: AgentState) -> dict:
    # ❌ 直接修改原 State
    state["history"].append("新消息")

    # ❌ 返回未定义的字段
    return {"unknown_field": "xxx"}

    # ❌ 忘记返回更新
    return {}
```

#### 更新机制对比

| 类型   | 默认行为 | 示例                                   |
| ---- | ---- | ------------------------------------ |
| 简单类型 | 覆盖   | `{"count": 1}` → count 变为 1          |
| 列表   | 覆盖   | `{"items": [1]}` → items 变为 [1],不是追加  |
| 字典   | 覆盖   | `{"config": {...}}` → config 被整体替换   |

**追加列表的正确写法**:

```python
# ❌ 错误:会覆盖
return {"history": ["新消息"]}

# ✅ 正确:保留旧值并追加
return {"history": state["history"] + ["新消息"]}
```

### 11.5 使用 Reducer 实现自动合并

#### 为什么需要 Reducer?

默认情况下,返回新值会**覆盖**旧值。如果想让列表自动追加,需要用 Reducer。

#### 内置 Reducer:add_messages

```python
from typing import Annotated
from langgraph.graph import add_messages

class ChatState(TypedDict):
    # 使用 add_messages reducer,自动追加消息
    messages: Annotated[list, add_messages]

# 节点中
def add_message(state: ChatState) -> dict:
    # 返回新消息,会自动追加到 messages 列表
    return {"messages": [{"role": "user", "content": "你好"}]}
```

#### 自定义 Reducer

```python
def merge_lists(left: list, right: list) -> list:
    """自定义合并函数:合并两个列表"""
    return left + right

class MyState(TypedDict):
    items: Annotated[list, merge_lists]

# 节点返回的新列表会自动与旧列表合并
return {"items": [1, 2, 3]}  # 自动追加,不是覆盖
```

### 11.6 必须记住的 8 条规则

| #   | 规则                | 说明                               |
| --- | ----------------- | -------------------------------- |
| 1   | **不能直接修改**        | `state["key"] = value` ❌         |
| 2   | **必须返回字典**        | 节点返回 `{"key": value}` ✅          |
| 3   | **只更新返回的字段**      | 其他字段保持不变                         |
| 4   | **字段必须预定义**       | 在 TypedDict 中声明                  |
| 5   | **get() 比 [] 安全** | `state.get("key", default)` 避免报错 |
| 6   | **所有节点共享**        | A 节点改了,B 节点能立刻看到                 |
| 7   | **列表默认覆盖**        | 追加要用 `state["list"] + [new]`     |
| 8   | **State 是唯一通道**   | 节点之间不传参,全靠 State                 |

### 11.7 常见问题

#### Q1: State 字段是必须的吗?

**没有强制字段**,完全自定义。只有使用 `add_messages` reducer 时,字段名必须是 `messages`。

#### Q2: 如何防止死循环?

在 State 中添加步数计数:

```python
class SafeState(TypedDict):
    step_count: int
    max_steps: int

def check_limit(state: SafeState) -> str:
    if state["step_count"] >= state["max_steps"]:
        return END
    return "continue"
```

#### Q3: State 数据量大了怎么办?

- 只存必要数据,大量数据存数据库,State 只存 ID
- 控制字段数量(建议 < 10 个)
- 定期清理历史记录

#### Q4: 多个图之间能共享 State 吗?

可以,通过子图(Subgraph)机制实现。

## 十二、总结

### 核心概念速查

| 概念             | 作用                 | 类比             |
| ---------------- | -------------------- | ---------------- |
| **State**        | 存储数据,像全局变量 | 游戏存档数据     |
| **Node**         | 处理动作,像函数     | 流水线上的工作站 |
| **Edge**         | 连接关系,像 if-else | 流水线上的传送带 |
| **Graph**        | 把上面三串起来         | 完整的流水线     |
| **Checkpointer** | 保存/恢复状态        | 游戏存档点       |
| **compile()**    | 打包成可执行文件     | 编译运行         |

### 学习路径建议

```
第1天:理解 State、Node、Edge 的概念
第2天:自己动手绘一个简单流程图
第3天:理解普通边和条件边的区别
第4天:学会用 Checkpointer 实现对话记忆
第5天:结合咱们项目做一个小 Demo
```

---

> 📚 **推荐阅读**
>
> - [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
> - [LangGraph GitHub Examples](https://github.com/langchain-ai/langgraph/tree/main/examples)
> - [LangGraph 官方文档 - State](https://langchain-ai.github.io/langgraph/how-tos/define-state/)
> - [Pydantic 官方文档](https://docs.pydantic.dev/)
>
> 🎯 **有问题随时问!**

---

_祝学习愉快,有问题找小明~_

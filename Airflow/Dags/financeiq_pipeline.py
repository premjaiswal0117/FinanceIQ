from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime


with DAG(
    dag_id="financeiq_etl_pipeline",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
) as dag:

    data_quality = BashOperator(
        task_id="data_quality",
        bash_command="python /opt/financeiq/Pipeline/02_Data_quality.py",
    )

    data_cleaning = BashOperator(
        task_id="data_cleaning",
        bash_command="python /opt/financeiq/Pipeline/03_Data_cleaning.py",
    )

    pyspark_postgresql = BashOperator(
        task_id="pyspark_to_postgresql",
        bash_command="python /opt/financeiq/Pipeline/04_PySpark_to_PostgreSQL.py",
    )

    data_quality >> data_cleaning >> pyspark_postgresql